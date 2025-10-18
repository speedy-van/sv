import Foundation

// MARK: - Network Service

class NetworkService {
    static let shared = NetworkService()
    
    private init() {
        // Configure JSON decoder for date handling
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try ISO8601 format first
            let iso8601Formatter = ISO8601DateFormatter()
            iso8601Formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            // Try without fractional seconds
            iso8601Formatter.formatOptions = [.withInternetDateTime]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            // Fallback to standard formatter
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
            if let date = formatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date")
        }
    }
    
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    
    // MARK: - Request Methods
    
    func request<T: Decodable>(
        _ endpoint: AppConfig.Endpoint,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        requiresAuth: Bool = true,
        headers: [String: String]? = nil,
        retryCount: Int = 0,
        maxRetries: Int = 3
    ) async throws -> T {
        var request = URLRequest(url: endpoint.url)
        request.httpMethod = method.rawValue
        request.timeoutInterval = AppConfig.requestTimeout
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication token
        if requiresAuth, let token = TokenStorage.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add custom headers (including Idempotency-Key)
        if let headers = headers {
            for (key, value) in headers {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }
        
        // Add correlation ID for tracing
        let correlationId = UUID().uuidString
        request.setValue(correlationId, forHTTPHeaderField: "X-Correlation-ID")
        
        // Add request body
        if let body = body {
            request.httpBody = try encoder.encode(body)
        }
        
        // Log request
        logRequest(request, body: body)
        
        // Perform request with error handling
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            // Network error - retry with exponential backoff
            if retryCount < maxRetries {
                let delay = pow(2.0, Double(retryCount)) + Double.random(in: 0...1.0)
                print("⏳ Network error, retrying in \(String(format: "%.1f", delay))s... (attempt \(retryCount + 1)/\(maxRetries))")
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                return try await request(endpoint, method: method, body: body, requiresAuth: requiresAuth, headers: headers, retryCount: retryCount + 1, maxRetries: maxRetries)
            }
            throw NetworkError.networkError(error)
        }
        
        // Log response
        logResponse(response, data: data)
        
        // Check response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }
        
        // Handle status codes
        switch httpResponse.statusCode {
        case 200...299:
            // Success - decode and return
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                print("❌ Decoding error: \(error)")
                if let jsonString = String(data: data, encoding: .utf8) {
                    print("📦 Response JSON: \(jsonString)")
                }
                throw NetworkError.decodingError(error)
            }
            
        case 401:
            // Unauthorized - clear token and throw
            TokenStorage.clearAll()
            throw NetworkError.unauthorized
            
        case 403:
            throw NetworkError.forbidden
            
        case 404:
            throw NetworkError.notFound
            
        case 500...599:
            // Server error - retry for 502, 503, 504
            if [502, 503, 504].contains(httpResponse.statusCode) && retryCount < maxRetries {
                let delay = pow(2.0, Double(retryCount)) + Double.random(in: 0...1.0)
                print("⏳ Server error \(httpResponse.statusCode), retrying in \(String(format: "%.1f", delay))s... (attempt \(retryCount + 1)/\(maxRetries))")
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                return try await request(endpoint, method: method, body: body, requiresAuth: requiresAuth, headers: headers, retryCount: retryCount + 1, maxRetries: maxRetries)
            }
            throw NetworkError.serverError(httpResponse.statusCode)
            
        default:
            throw NetworkError.httpError(httpResponse.statusCode)
        }
    }
    
    // MARK: - Logging
    
    private func logRequest(_ request: URLRequest, body: Encodable?) {
        guard AppConfig.enableLogging else { return }
        
        print("📤 REQUEST:")
        print("   Method: \(request.httpMethod ?? "GET")")
        print("   URL: \(request.url?.absoluteString ?? "Unknown")")
        
        if let headers = request.allHTTPHeaderFields {
            print("   Headers: \(headers)")
        }
        
        if let body = body {
            if let jsonData = try? encoder.encode(body),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                print("   Body: \(jsonString)")
            }
        }
    }
    
    private func logResponse(_ response: URLResponse, data: Data) {
        guard AppConfig.enableLogging else { return }
        
        if let httpResponse = response as? HTTPURLResponse {
            print("📥 RESPONSE:")
            print("   Status: \(httpResponse.statusCode)")
            
            if let jsonString = String(data: data, encoding: .utf8) {
                print("   Body: \(jsonString)")
            }
        }
    }
}

// MARK: - HTTP Method

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - Network Error

enum NetworkError: LocalizedError {
    case invalidResponse
    case unauthorized
    case forbidden
    case notFound
    case serverError(Int)
    case httpError(Int)
    case decodingError(Error)
    case encodingError(Error)
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Unauthorized - Please login again"
        case .forbidden:
            return "Access forbidden"
        case .notFound:
            return "Resource not found"
        case .serverError(let code):
            return "Server error (Code: \(code))"
        case .httpError(let code):
            return "HTTP error (Code: \(code))"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Failed to encode request: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}


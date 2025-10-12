/**
 * File upload configuration for Speedy Van
 */

export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  uploadPath: string;
}

export const UPLOAD_CONFIGS = {
  DOCUMENTS: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    uploadPath: '/uploads/documents',
  },
  IMAGES: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    uploadPath: '/uploads/images',
  },
  AVATARS: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    uploadPath: '/uploads/avatars',
  },
} as const;

export const UPLOAD_DIRS = {
  DOCUMENTS: '/uploads/documents',
  IMAGES: '/uploads/images',
  AVATARS: '/uploads/avatars',
} as const;

export function validateFile(
  file: File,
  config: UploadConfig
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(config.maxFileSize / 1024 / 1024)}MB`,
    };
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  return { valid: true };
}

export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  return `${timestamp}-${random}.${extension}`;
}

export function getUploadConfig(type: keyof typeof UPLOAD_CONFIGS): UploadConfig {
  const config = UPLOAD_CONFIGS[type];
  return {
    maxFileSize: config.maxFileSize,
    allowedTypes: [...config.allowedTypes],
    allowedExtensions: [...config.allowedExtensions],
    uploadPath: config.uploadPath,
  };
}

export function validateFileSize(file: File | number, maxSize: number): { valid: boolean; error?: string } {
  const size = typeof file === 'number' ? file : file.size;
  const valid = size <= maxSize;
  return {
    valid,
    error: valid ? undefined : `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
  };
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function isPathSafe(path: string, baseDir?: string): boolean {
  const base = baseDir || '/uploads/';
  return !path.includes('..') && !path.includes('~') && path.startsWith(base);
}

export function scanFileForMalware(file: File | string): Promise<{ clean: boolean; threat?: string }> {
  // Mock implementation - in real app, integrate with antivirus service
  return Promise.resolve({ clean: true });
}

export function getCORSHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function checkRateLimit(userId: string): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
  // Mock implementation - in real app, use Redis or similar
  return Promise.resolve({ allowed: true, remaining: 100 });
}

export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'text/plain', 'application/msword'],
  AVATARS: ['image/jpeg', 'image/png'],
} as const;

export const SECURITY_CONFIG = {
  maxFilesPerRequest: 10,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc'],
  requireAuth: true,
} as const;

// Additional exports for upload routes
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    pdf: 'application/pdf',
    txt: 'text/plain',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
'use client';

import { useEffect, useState } from 'react';

/**
 * Cookie Diagnostic Page
 * Visit: http://localhost:3000/debug/cookies
 * 
 * This page helps diagnose cookie authentication issues
 */
export default function CookieDiagnosticPage() {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentHost, setCurrentHost] = useState('');
  const [isCorrectHost, setIsCorrectHost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHost(window.location.host);
      setIsCorrectHost(window.location.host.includes('localhost'));
      // Auto-run diagnostic on load
      runDiagnostic();
    }
  }, []);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/cookies', {
        credentials: 'include'
      });
      const data = await response.json();
      setDiagnosticData(data);
    } catch (error: any) {
      setDiagnosticData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Cookie Diagnostic Tool</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 {
            color: #1a202c;
            margin-bottom: 10px;
            font-size: 32px;
          }
          .subtitle {
            color: #718096;
            margin-bottom: 30px;
            font-size: 16px;
          }
          .warning {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .warning h2 {
            color: #856404;
            margin-bottom: 10px;
            font-size: 20px;
          }
          .warning ul {
            list-style: none;
            margin-left: 0;
          }
          .warning li {
            color: #856404;
            margin: 8px 0;
            padding-left: 25px;
            position: relative;
          }
          .warning li:before {
            content: "⚠️";
            position: absolute;
            left: 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #2d3748;
            font-size: 20px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #A9B4CC;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 12px;
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
          }
          .info-label {
            font-weight: 600;
            color: #4a5568;
          }
          .info-value {
            color: #2d3748;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            word-break: break-all;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
          }
          .status.success { background: #c6f6d5; color: #22543d; }
          .status.error { background: #fed7d7; color: #742a2a; }
          .status.warning { background: #feebc8; color: #7c2d12; }
          .button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-right: 10px;
          }
          .button:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .button.secondary {
            background: #48bb78;
          }
          .button.secondary:hover {
            background: #38a169;
          }
          .button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          pre {
            background: #1a202c;
            color: #A9B4CC;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.6;
          }
          .recommendation {
            background: #e6fffa;
            border-left: 4px solid #38b2ac;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
          }
          .recommendation.error {
            background: #fff5f5;
            border-left-color: #fc8181;
          }
          .recommendation.success {
            background: #f0fff4;
            border-left-color: #48bb78;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>🍪 Cookie Diagnostic Tool</h1>
          <p className="subtitle">Debug authentication cookie issues</p>

          <div className="warning">
            <h2>Common Issue: Using Wrong URL</h2>
            <ul>
              <li><strong>❌ WRONG:</strong> http://0.0.0.0:3000</li>
              <li><strong>✅ CORRECT:</strong> http://localhost:3000</li>
              <li>Cookies will NOT work on 0.0.0.0!</li>
            </ul>
          </div>

          <div className="section">
            <h2>Current URL Check</h2>
            <div className="info-grid">
              <div className="info-label">Current URL:</div>
              <div className="info-value">{typeof window !== 'undefined' ? window.location.href : 'Loading...'}</div>
              <div className="info-label">Status:</div>
              <div className="info-value">
                {isCorrectHost ? (
                  <span className="status success">✅ Correct (localhost)</span>
                ) : (
                  <span className="status error">❌ Wrong! Use localhost:3000</span>
                )}
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Actions</h2>
            <button className="button" onClick={() => window.location.href = '/auth/login'}>
              Go to Login
            </button>
            <button className="button secondary" onClick={() => runDiagnostic()}>
              Refresh Diagnostic
            </button>
          </div>

          <div className="section">
            <h2>Diagnostic Results</h2>
            <button className="button" onClick={runDiagnostic} disabled={loading}>
              {loading ? '⏳ Loading...' : '🔍 Run Diagnostic'}
            </button>
            <div style={{ marginTop: '20px' }}>
              {loading && <p>Loading...</p>}
              {diagnosticData && !loading && (
                <>
                  <h3 style={{ marginBottom: '15px' }}>Quick Analysis:</h3>
                  {diagnosticData.analysis?.recommendations?.map((rec: string, idx: number) => {
                    const type = rec.startsWith('✅') ? 'success' : rec.startsWith('❌') ? 'error' : 'warning';
                    return (
                      <div key={idx} className={`recommendation ${type}`}>
                        {rec}
                      </div>
                    );
                  })}
                  <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Full Details:</h3>
                  <pre>{JSON.stringify(diagnosticData, null, 2)}</pre>
                </>
              )}
            </div>
          </div>

          <div className="section">
            <h2>Client-Side Cookie Check</h2>
            <div className="info-grid">
              <div className="info-label">document.cookie:</div>
              <div className="info-value">
                {typeof window !== 'undefined' && document.cookie ? (
                  document.cookie
                ) : (
                  <span className="status warning">Empty (this is normal for httpOnly cookies)</span>
                )}
              </div>
              <div className="info-label">Note:</div>
              <div className="info-value">
                auth-token won't appear here because it's httpOnly (security feature)
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

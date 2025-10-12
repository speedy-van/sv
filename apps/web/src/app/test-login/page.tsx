'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SimpleLoginTest() {
  const [email, setEmail] = useState('deloalo99@gmail.com');
  const [password, setPassword] = useState('Aa234311Aa@@@');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    console.log('🔐 [TEST] Starting sign in...');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log('📦 [TEST] SignIn result:', res);
      setResult(res);
    } catch (error) {
      console.error('❌ [TEST] SignIn error:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '50px auto', padding: 20 }}>
      <h1>🧪 Simple Login Test</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Test NextAuth authentication directly
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, fontSize: 16 }}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5 }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, fontSize: 16 }}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            fontSize: 16,
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            backgroundColor: result.ok ? '#d4edda' : '#f8d7da',
            color: result.ok ? '#155724' : '#721c24',
            borderRadius: 5,
          }}
        >
          <h3>Result:</h3>
          <pre style={{ overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          {result.ok && (
            <p style={{ marginTop: 10 }}>
              ✅ <strong>Success!</strong> Check the browser console for detailed logs.
            </p>
          )}
          {!result.ok && (
            <p style={{ marginTop: 10 }}>
              ❌ <strong>Failed!</strong> Error: {result.error}
            </p>
          )}
        </div>
      )}

      <div style={{ marginTop: 30, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
        <h3>Test Accounts:</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <strong>deloalo99@gmail.com</strong> / Aa234311Aa@@@
          </li>
          <li>
            <strong>ahmadalwakai76@gmail.com</strong> / Aa234311Aa@@@
          </li>
        </ul>
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        <p>💡 Open browser console (F12) to see detailed logs</p>
        <p>🔍 Check terminal for server-side logs</p>
      </div>
    </div>
  );
}

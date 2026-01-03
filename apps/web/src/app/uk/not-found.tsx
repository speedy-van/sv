import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-container" style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Place Not Found</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        The place you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link 
        href="/uk" 
        style={{
          background: '#2563eb',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: '500'
        }}
      >
        Browse UK Areas
      </Link>
    </div>
  );
}

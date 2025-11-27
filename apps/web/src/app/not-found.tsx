import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#1a202c' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#4a5568' }}>
        صفحة غير موجودة
      </h2>
      <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: '#718096' }}>
        عذراً، الصفحة التي تبحث عنها غير موجودة.
      </p>
      <Link href="/" style={{ 
        display: 'inline-block', 
        padding: '12px 24px', 
        backgroundColor: '#2563EB', 
        color: 'white', 
        textDecoration: 'none', 
        borderRadius: '5px',
        fontSize: '1.125rem'
      }}>
        العودة للصفحة الرئيسية
      </Link>
    </div>
  );
}

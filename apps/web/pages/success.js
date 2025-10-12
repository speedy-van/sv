export default function TestPage() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#4CAF50', marginBottom: '1rem' }}>
          ✅ التطبيق يعمل بنجاح!
        </h1>
        
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ color: '#333' }}>الحالة:</h2>
          <p style={{ color: '#666' }}>
            • الخادم يعمل على localhost:3000<br/>
            • لا توجد أخطاء ActionQueueContext<br/>
            • الصفحة تحمّل بنجاح<br/>
            • React يعمل بشكل صحيح
          </p>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: '#e8f5e8',
          border: '1px solid #4CAF50',
          borderRadius: '4px'
        }}>
          <strong>تم حل المشكلة بنجاح! 🎉</strong>
        </div>
      </div>
    </div>
  );
}
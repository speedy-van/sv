import { useEffect } from 'react';

export default function SimplePage() {
  useEffect(() => {
    console.log('Simple page loaded successfully!');
  }, []);

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>التطبيق يعمل بنجاح! 🎉</h1>
      <p>تم حل مشكلة ActionQueueContext</p>
      <p>الصفحة تحمّل بدون أخطاء</p>
    </div>
  );
}
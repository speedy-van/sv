const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'Aa234311Aa@@@';
  const saltRounds = 12;

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('🔐 Password Hash Generated:');
    console.log('📧 Email: ahmadalwakai76+admin@gmail.com');
    console.log('🔑 Password:', password);
    console.log('🔒 Hash:', hash);
    console.log('\n📝 SQL Command:');
    console.log(
      `UPDATE "User" SET password = '${hash}' WHERE email = 'ahmadalwakai76+admin@gmail.com';`
    );
  } catch (error) {
    console.error('❌ Error generating hash:', error);
  }
}

generateHash();

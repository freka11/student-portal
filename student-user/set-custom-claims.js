// Script to set custom claims for all users
// Usage: node set-custom-claims.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: 'student-portal-fab55',
  clientEmail: 'firebase-adminsdk-fbsvc@student-portal-fab55.iam.gserviceaccount.com',
  privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCd5aGc94Si7R0u\nrg3cw49vJ/ylUROIPMc+D5yVw7Fxv9aVUkfp2zWG4A0mDXHfcWNPUWgHyG3VpC7K\nC8U162/L+4j9zhwRIyPnDQC6804QUaYhqCu4Fa8QEmQUqzDIrABsvA/37qQAW3M4\nJ7E87jLlMXIizUEwnzjxs1b7GY7Osw5Kgd1eEVIh8iL3G7h2ee3PBFFhKB+/8vxI\nwmZBz3YROTK5ADnGrS5dKwX5NA+OUbQ7k3HgBmRDW/ENVitb2ikwvnlSfDGcOdB3\nfrYDyNgMFx9ZjmF93O8vvV67dX71ITC6WhnrC6hGp6IPG+EAWjJsSECwrNqwMlCA\nmz+iD9bRAgMBAAECggEAF4CltLKXGJVIwbkAsTqesAH4tjbCPIYndhJm0VgGopLW\ngvVzZNjPN9tDucVIjOTYzmakoHvx9Vnx6PsliKgZxPgU5Qp33Qko/+xMjodGuGEe\n5GWe1FDN9Qt3wCfXJBeOHKFFkzb/TFpQZSxrUlF2W+0nOwzoRi99D2UNbmTYf+Wl\nQK11d/opoQgkSemZMrNiFFsx/LOCV9+itlpafNp3WvyBxHoSPXwsh5z/2Eeia8Q0\nfpuN5vztcRGfc4WxLlwmnyktHbVpRvp5Gh6Z6lY5FS1x9dG4rLELgCIIV9CRpi+M\nuQ7ElbCyHSxQADCX6pKJt+CkmcqJSviAa7Swi91A/QKBgQDLSMWAcdgZwbBgcq4R\n3nKWgI6/ZyBTz3am6fKnlt5aeyaUg5r9PD9gtiOy7WYDF/i0HKXuqgYWv4tBlNJ4\nGW1C739cacBZ8N8qm03/1Vbn1Zn3JLswrcWM1jjDBioD03T/1XpGKHQmgjIJ/qxS\nkvjTKckV3HFPRBa4Sp7f8h7i0wKBgQDG18fn8kuZwizjZfaVZZnIUMLs6UZA8ll3\nq5IGirDBKtj+tE+DxpfYGkzNwDZsvLb+8d4KxI6vjwTr54tsZvJl1wU2tX5hv+H0\nVlUwPTCihfBOuVw36fKxBXldH2x0yYRvcPj6Mau+z90k5Z4v8sLo1zTBh+ocS9xQ\nAtXeZmMxSwKBgHCjwBwt+Mo80th+cwmfsurGDVLtd7I48MwIMda++DI2ruf4DHdp\nXMzf3+QTO0VXkQ1sGl2mhH0yYZ1TM1Qs8qf2QSIZzuWHXIElUREDS4Zmi0uwZLDS\nePZS9VzLG5jHILtptLkPTVzRI5z6Ks4OdiW7r5qXbYm4dsZjQqlgZdDVAoGBALZ8\nfjh+g6d/LxcbEqyVbAcNJ3eptxIP2NAdI4zhZ8o/+pn2/Sqg7eYkbOw/RTOSFhfv\n/anALnssNIYUID7CVB/msCA/fNdU9Jf7S39UCPh/F8YIE3w1NsgDkBhIqI6eCu8D\nrVxgjZA20Gv2V7EFiJ+MMhyTEeYaMP01PPY43Tv1AoGAMniwPxQCe1kwy9A1IhyL\nI8XdenwIWKsue7aS/am+oVZxPvhTdWScGiLhgHSABdmdF1lvAkdNSDCYV019LnzC\n0xJNZbpoIV/CppqcNwfDWZoKcssTWR5LxqhI30au1qtbuspA1tjkzG6VyhgkjEBg\nm6iCCg70UpJFwQXDBBRf6QQ=\n-----END PRIVATE KEY-----\n'
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'student-portal-fab55'
});

async function setCustomClaims() {
  console.log('🚀 Setting custom claims for all users...');

  // Define users and their roles
  const users = [
    { email: 'admin@admin.com', role: 'admin', displayName: 'Admin User' },
    { email: '2@admin.com', role: 'admin', displayName: 'Second Admin' },
    { email: 'rahul@student.com', role: 'student', displayName: 'Rahul' },
    { email: 'likhith@student.com', role: 'student', displayName: 'Likhith' }
  ];

  for (const user of users) {
    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(user.email);
      
      // Set custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: user.role,
        permissions: user.role === 'admin' ? ['all'] : ['chat_with_admin', 'view_questions']
      });

      console.log(`✅ Set claims for ${user.email}: role=${user.role}`);

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`❌ User not found: ${user.email}`);
      } else {
        console.error(`❌ Error setting claims for ${user.email}:`, error.message);
      }
    }
  }

  console.log('\n🎉 Custom claims setup complete!');
  console.log('\n📝 User Roles:');
  console.log('🔧 Admins:');
  console.log('  - admin@admin.com');
  console.log('  - 2@admin.com');
  console.log('👥 Students:');
  console.log('  - rahul@student.com');
  console.log('  - likhith@student.com');
  
  console.log('\n⚠️  IMPORTANT: Users must log out and log back in to get new claims!');
  
  process.exit(0);
}

setCustomClaims().catch(console.error);

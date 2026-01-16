// Run this script to populate Firestore with admin users
// Usage: node setup-firestore-admins.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function setupAdmins() {
  try {
    const admins = [
      {
        username: 'admin',
        password: 'admin123',
        name: 'Admin1',
        role: 'admin',
        createdAt: new Date()
      },
      {
        username: '2',
        password: '2',
        name: 'Admin2',
        role: 'admin',
        createdAt: new Date()
      }
    ];

    console.log('Creating admin users in Firestore...');

    for (const adminData of admins) {
      // Check if admin already exists
      const existingAdmin = await db
        .collection('admins')
        .where('username', '==', adminData.username)
        .get();

      if (existingAdmin.empty) {
        // Create new admin
        await db.collection('admins').add(adminData);
        console.log(`✅ Created admin: ${adminData.username}`);
      } else {
        // Update existing admin
        const adminId = existingAdmin.docs[0].id;
        await db.collection('admins').doc(adminId).update(adminData);
        console.log(`🔄 Updated admin: ${adminData.username}`);
      }
    }

    console.log('\n✅ Admin setup complete!');
    console.log('You can now login with:');
    console.log('- Username: admin, Password: admin123');
    console.log('- Username: 2, Password: 2');

  } catch (error) {
    console.error('❌ Error setting up admins:', error);
  } finally {
    process.exit();
  }
}

setupAdmins();

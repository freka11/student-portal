const admin = require('firebase-admin');
const serviceAccount = require('../student-user/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || 'student-portal-9a5b7'
});

const db = admin.firestore();
const auth = admin.auth();

async function createSuperAdmin() {
  try {
    console.log('🔥 Creating super admin: superadmin@admin.com');
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: 'superadmin@admin.com',
      password: 'superadmin',
      displayName: 'Super Admin',
    });
    
    console.log('✅ Firebase Auth user created:', userRecord.uid);
    
    // Create user document in Firestore
    const userDoc = {
      uid: userRecord.uid,
      email: 'superadmin@admin.com',
      name: 'Super Admin',
      role: 'super_admin',
      publicId: 'SUP-0002',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: true,
      disabled: false
    };
    
    await db.collection('users').doc(userRecord.uid).set(userDoc);
    
    console.log('✅ Firestore user document created');
    console.log('🎉 Super admin created successfully!');
    console.log('📧 Email: superadmin@admin.com');
    console.log('🔑 Password: superadmin');
    console.log('👑 Role: super_admin');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    process.exit(0);
  }
}

createSuperAdmin();

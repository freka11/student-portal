// Test script to verify user creation in Firestore
// Run this with: node test-users.js (after installing firebase-admin)

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (you'll need to add your service account key)
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'student-portal-fab55'
});

const db = admin.firestore();

async function testUsers() {
  try {
    console.log('🔍 Testing user creation in Firestore...');
    
    // Check if users collection exists and has users
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`📊 Found ${usersSnapshot.size} users in Firestore:`);
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found. You need to login first!');
      console.log('💡 Try logging in as both student and admin to create users.');
    } else {
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`✅ User: ${data.name} (${data.email}) - Role: ${data.role}`);
      });
    }
    
    // Test specific role queries
    const adminQuery = await db.collection('users').where('role', '==', 'admin').get();
    const studentQuery = await db.collection('users').where('role', '==', 'student').get();
    
    console.log(`\n👨‍💼 Admins: ${adminQuery.size}`);
    console.log(`👨‍🎓 Students: ${studentQuery.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testUsers().then(() => process.exit(0));

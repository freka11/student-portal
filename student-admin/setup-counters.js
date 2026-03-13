// Script to initialize Firestore counters for public ID generation
// Usage: node scripts/setup-counters.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'student-portal-fab55',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('❌ Firebase Admin credentials not found in environment variables.');
  console.error('Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupCounters() {
  console.log('🔥 Setting up Firestore counters for public ID generation...');

  try {
    // Initialize counters for all roles
    const counters = [
      { id: 'studentCounter', lastNumber: 0, prefix: 'STU' },
      { id: 'adminCounter', lastNumber: 0, prefix: 'ADM' },
      { id: 'teacherCounter', lastNumber: 0, prefix: 'TCH' },
      { id: 'superAdminCounter', lastNumber: 0, prefix: 'SUP' }
    ];

    for (const counter of counters) {
      await db.collection('counters').doc(counter.id).set({
        lastNumber: counter.lastNumber,
        prefix: counter.prefix,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Created counter: ${counter.id} (${counter.prefix}-XXXX)`);
    }

    console.log('\n🎉 All counters initialized successfully!');
    console.log('📊 Counters created:');
    console.log('  - studentCounter (STU-0001, STU-0002, ...)');
    console.log('  - adminCounter (ADM-0001, ADM-0002, ...)');
    console.log('  - teacherCounter (TCH-0001, TCH-0002, ...)');
    console.log('  - superAdminCounter (SUP-0001, SUP-0002, ...)');
    console.log('\n🚀 Ready for public ID generation!');
    
  } catch (error) {
    console.error('❌ Error setting up counters:', error);
    throw error;
  }
}

setupCounters().then(() => {
  console.log('🔄 Script completed. Exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});

// Simple script to create Firestore collections
// Usage: node create-firestore-collections.js

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin using environment variables
const admin = require('firebase-admin');

// Get service account from environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'student-portal-fab55',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@student-portal-fab55.iam.gserviceaccount.com',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!serviceAccount.privateKey) {
  console.error('❌ FIREBASE_PRIVATE_KEY not found in environment variables');
  console.log('💡 Please run this script from within the Next.js environment or set FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.projectId
});

async function createCollections() {
  console.log('🔥 Creating Firestore collections with proper schema...');

  try {
    const db = getFirestore();

    // Create sample question document
    await setDoc(doc(db, 'questions', 'sample-question'), {
      text: 'What is your favorite programming language and why?',
      status: 'published',
      targetAudience: 'students',
      createdBy: {
        uid: 'admin-uid-sample',
        name: 'Admin User'
      },
      createdAt: serverTimestamp(),
      publishDate: '2024-01-16'
    });

    // Create sample thought document
    await setDoc(doc(db, 'thoughts', 'sample-thought'), {
      text: 'Today is a great day to learn something new and expand your knowledge!',
      status: 'published',
      targetAudience: 'students',
      createdBy: {
        uid: 'admin-uid-sample',
        name: 'Admin User'
      },
      createdAt: serverTimestamp(),
      publishDate: '2024-01-16'
    });

    console.log('✅ Firestore collections created successfully!');
    console.log('📝 Collections created with sample data:');
    console.log('  - questions/ (with sample document)');
    console.log('  - thoughts/ (with sample document)');
    console.log('');
    console.log('🎯 Schema Structure:');
    console.log('  questions/{questionId}');
    console.log('  thoughts/{thoughtId}');
    console.log('');
    console.log('🎉 Ready for real-time updates!');
    console.log('💡 You can now test the admin-student content sharing!');
    
  } catch (error) {
    console.error('❌ Error creating collections:', error);
  }
}

createCollections().then(() => {
  console.log('🔄 Script completed. Exiting...');
  process.exit(0);
});

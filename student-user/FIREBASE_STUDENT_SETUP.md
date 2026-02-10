# Firebase Student User Setup Guide

## 1. Firebase Console Configuration

### Enable Email/Password Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `student-portal-fab55`
3. Go to **Authentication** → **Sign-in method**
4. Ensure **Email/Password** provider is enabled
5. Click **Save**

### Create Student Users
Create these users in Firebase Authentication:

#### Student 1:
- **Email**: `rahul@student.com`
- **Password**: `rahul123`

#### Student 2:
- **Email**: `likhith@student.com`
- **Password**: `likhith123`

## 2. How to Create Users

### Option A: Via Firebase Console
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Add user**

### Option B: Via Script (Automated)
Run this script to create users programmatically:

```javascript
// In your browser console or Node.js with Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize with your credentials
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'student-portal-fab55',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

async function createStudentUsers() {
  const users = [
    { email: 'rahul@student.com', password: 'rahul123' },
    { email: 'likhith@student.com', password: 'likhith123' }
  ];

  for (const user of users) {
    try {
      await admin.auth().createUser({
        email: user.email,
        password: user.password,
        emailVerified: true
      });
      console.log(`✅ Created student: ${user.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ Student already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, error);
      }
    }
  }
}

createStudentUsers();
```

## 3. Login Credentials

Once setup is complete, students can login with:

### Student Login Form:
- **Username**: `rahul`, **Password**: `rahul123`
- **Username**: `likhith`, **Password**: `likhith123`

### Email Format (Direct):
- **Email**: `rahul@student.com`, **Password**: `rahul123`
- **Email**: `likhith@student.com`, **Password**: `likhith123`

## 4. How It Works

### Username → Email Conversion:
- `rahul` → `rahul@student.com`
- `likhith` → `likhith@student.com`
- Full email addresses are used as-is

### Authentication Flow:
1. Student enters username/password
2. Converts username to email format
3. Firebase Auth verifies credentials
4. Gets ID token
5. Server verifies token and creates session
6. Student is logged in

## 5. Security Features

✅ **Password hashing** handled by Firebase
✅ **Session management** with HTTP-only cookies
✅ **Token verification** on server-side
✅ **Route protection** via middleware
✅ **Error handling** for invalid credentials

## 6. Testing

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Go to `http://localhost:3001/user/login` (or your port)
4. Try logging in with the credentials above
5. Both username and email login should work

## 7. Next Steps

- Add role-based access control (student vs admin)
- Implement password reset
- Add user profile management
- Set up custom claims for roles
- Add multi-factor authentication

## 8. Port Configuration

Since both admin and user projects use Next.js, make sure they run on different ports:
- Admin: `http://localhost:3000`
- User: `http://localhost:3001`

Update your `package.json` scripts if needed:
```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "eslint"
  }
}

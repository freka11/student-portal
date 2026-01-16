# Firebase Authentication Setup Guide

## 1. Firebase Console Configuration

### Enable Email/Password Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `student-portal-fab55`
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

### Create Admin Users
Create these users in Firebase Authentication:

#### User 1:
- **Email**: `admin@admin.com`
- **Password**: `admin123`

#### User 2:
- **Email**: `2@admin.com`
- **Password**: `2`

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

async function createAdminUsers() {
  const users = [
    { email: 'admin@admin.com', password: 'admin123' },
    { email: '2@admin.com', password: '2' }
  ];

  for (const user of users) {
    try {
      await admin.auth().createUser({
        email: user.email,
        password: user.password,
        emailVerified: true
      });
      console.log(`✅ Created user: ${user.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, error);
      }
    }
  }
}

createAdminUsers();
```

## 3. Login Credentials

Once setup is complete, you can login with:

### Traditional Login Form:
- **Username**: `admin`, **Password**: `admin123`
- **Username**: `2`, **Password**: `2`

### Google Sign-In:
- Click "Sign in with Google" button

## 4. How It Works

### Username → Email Conversion:
- `admin` → `admin@admin.com`
- `2` → `2@admin.com`
- Full email addresses are used as-is

### Authentication Flow:
1. User enters username/password
2. Converts username to email format
3. Firebase Auth verifies credentials
4. Gets ID token
5. Server verifies token and creates session
6. User is logged in

## 5. Security Features

✅ **Password hashing** handled by Firebase
✅ **Session management** with HTTP-only cookies
✅ **Token verification** on server-side
✅ **Route protection** via middleware
✅ **Error handling** for invalid credentials

## 6. Testing

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/admin/login`
3. Try logging in with the credentials above
4. Both traditional login and Google Sign-In should work

## 7. Troubleshooting

### "User not found" Error:
- Check if users exist in Firebase Console
- Verify email format (username@admin.com)

### "Invalid password" Error:
- Verify password matches exactly
- Check for extra spaces

### "Firebase configuration error":
- Verify `.env.local` has correct Firebase credentials
- Check Firebase project ID matches

## 8. Next Steps

- Add role-based access control
- Implement password reset
- Add multi-factor authentication
- Set up user profile management

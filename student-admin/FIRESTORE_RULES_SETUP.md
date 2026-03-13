# Firestore Security Rules Setup - URGENT FIX FOR CHAT

## ⚠️ IMMEDIATE ACTION REQUIRED
Your chat feature is showing "Missing or insufficient permissions" error because Firestore security rules are blocking access. Follow these steps to fix it immediately.

## QUICK FIX - TEMPORARY RULES (For Testing)

### Step 1: Copy These Rules
Open `student-portal/student-admin/firestore.rules` file. It should contain these TEMPORARY rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all access for authenticated users (TEMPORARY FOR TESTING)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 2: Deploy to Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `student-portal-fab55`
3. Navigate to **Firestore Database** → **Rules**
4. **DELETE ALL EXISTING RULES**
5. Copy the rules from Step 1 above
6. Paste into the Firebase Console rules editor
7. Click **Publish**

### Step 3: Test Immediately
1. Go to your chat page: `http://localhost:3000/admin/chat`
2. Login if not already logged in
3. The chat should now work without permission errors

## Why This Error Happened
- Firestore requires security rules to allow/deny access
- Your current rules are too restrictive or not deployed
- The chat feature needs at least basic rules to function

## Overview
The chat feature requires proper Firestore security rules to function. The rules ensure that:
- Users can only read/write their own user documents
- Users can only access conversations they're part of
- Users can only create messages they're sending
- Users can only update messages in conversations they're part of

## How to Deploy Rules

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not already done):
   ```bash
   firebase init
   ```

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` file
5. Paste into the Firebase Console rules editor
6. Click **Publish**

## Rules Explanation

### Users Collection
```
/users/{userId}
- Read: Only the user can read their own document
- Write: Only the user can write to their own document
```

### Conversations Collection
```
/conversations/{conversationId}
- Read: Only admin or student in the conversation can read
- Create: Only the admin can create conversations
- Update: Both admin and student can update (for unread counts, etc.)
```

### Messages Subcollection
```
/conversations/{conversationId}/messages/{messageId}
- Read: Only admin or student in the conversation can read
- Create: Only the message sender can create messages
- Update: Both admin and student can update (for read status, delivery status)
```

## Testing the Rules

After deploying, test by:

1. **Login as Admin**: Try to access chat and send messages
2. **Login as Student**: Try to access chat and send messages
3. **Verify Permissions**: Try to access a conversation you're not part of (should fail)

## Troubleshooting

### Still Getting "Missing or insufficient permissions" Error?

1. **Check Authentication**: Ensure users are properly authenticated
   - Verify `request.auth.uid` is set in Firebase Console Rules Simulator
   - Check browser console for auth errors

2. **Verify User Data**: Ensure users have `adminId` and `studentId` fields in conversations
   - Go to Firestore Console
   - Check conversation documents have correct structure

3. **Check User Documents**: Ensure user documents exist in `/users/{userId}`
   - Create test user documents if needed

4. **Test Rules**: Use Firebase Console Rules Simulator
   - Go to Firestore → Rules → Simulator
   - Test read/write operations with different user IDs

## Security Considerations

These rules provide basic security. For production, consider:

1. **Add validation** for message content (length, format)
2. **Add rate limiting** to prevent spam
3. **Add data validation** for conversation fields
4. **Use custom claims** for role-based access control
5. **Add audit logging** for sensitive operations

## Example: Adding Rate Limiting

To prevent spam, you can add rate limiting rules:

```
// Add to messages subcollection rules
allow create: if request.auth.uid == request.resource.data.senderId &&
                 request.time > resource.data.timestamp + duration.value(1, 's');
```

## References

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/start)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Firestore Rules Simulator](https://firebase.google.com/docs/firestore/security/test-rules-simulator)

## ⚠️ IMPORTANT: Create Firestore Database First

If you haven't created the Firestore database yet:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `student-portal-fab55`
3. Click **Firestore Database** in the left menu
4. Click **Create database**
5. Choose **Start in test mode** (for now)
6. Select a location (choose closest to you)
7. Click **Enable**

**Note**: "Test mode" gives open access for 30 days. After deploying our rules, it will use our rules instead.

## Still Having Issues?

If you've followed all steps and still get errors:

1. **Open browser console** (F12 → Console)
2. **Check for specific error messages**
3. **Take a screenshot** of the errors
4. **Check if you're logged in** (try logging out and back in)
5. **Clear browser cache** and refresh

Common issues:
- Firestore database not created
- Rules not published (click "Publish" after pasting)
- User not authenticated with Firebase
- Wrong Firebase project ID in .env.local
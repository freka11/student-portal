# 🔧 Firebase Custom Claims Setup Guide

## 📋 **Overview**

Custom claims in Firebase allow you to define user roles and permissions that are securely embedded in the user's ID token. This is perfect for implementing role-based access control.

## 🚀 **Quick Setup Methods**

### **Method 1: Using the Custom Script (Recommended)**

I've created a management script for you:

```bash
# Navigate to backend directory
cd backend

# Install ts-node if not already installed
npm install -g ts-node

# Set user as admin
npx ts-node src/scripts/setCustomClaims.ts set-admin <USER_UID>

# Set user as student  
npx ts-node src/scripts/setCustomClaims.ts set-student <USER_UID>

# Set user as teacher
npx ts-node src/scripts/setCustomClaims.ts set-teacher <USER_UID>

# Get current claims for a user
npx ts-node src/scripts/setCustomClaims.ts get <USER_UID>

# List all users and their claims
npx ts-node src/scripts/setCustomClaims.ts list
```

### **Method 2: Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Authentication → Users
4. Click on a user to see their UID
5. Use the script above with their UID

### **Method 3: Manual Code**

```typescript
import { getAuth } from 'firebase-admin/auth'

const auth = getAuth()

// Set admin claims
await auth.setCustomUserClaims('USER_UID', {
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users']
})

// Set student claims
await auth.setCustomUserClaims('USER_UID', {
  role: 'student', 
  permissions: ['read', 'write']
})
```

## 🎯 **Available Roles & Permissions**

### **Admin Role**
```json
{
  "role": "admin",
  "permissions": ["read", "write", "delete", "manage_users"]
}
```
- ✅ Access to all admin endpoints
- ✅ Can manage other users
- ✅ Full CRUD operations

### **Student Role**
```json
{
  "role": "student",
  "permissions": ["read", "write"]
}
```
- ✅ Access to student endpoints
- ✅ Can submit answers
- ✅ Cannot access admin areas

### **Teacher Role**
```json
{
  "role": "teacher", 
  "permissions": ["read", "write", "manage_content"]
}
```
- ✅ Can create and edit content
- ✅ Cannot manage users
- ✅ Moderate access

### **Super Admin Role**
```json
{
  "role": "super_admin",
  "permissions": ["all"]
}
```
- ✅ Complete system access
- ✅ Can manage everything

## 📝 **Step-by-Step Example**

### **Step 1: Find User UID**

```bash
# List all users to find UIDs
npx ts-node src/scripts/setCustomClaims.ts list

# Output example:
👥 Found 2 users:
- user@example.com (abc123def456): {"role":"student"}
- admin@example.com (xyz789uvw012): null
```

### **Step 2: Set Admin Claims**

```bash
# Make admin@example.com an admin
npx ts-node src/scripts/setCustomClaims.ts set-admin xyz789uvw012

# Output:
✅ Custom claims set for user xyz789uvw012: {
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users']
}
✅ Firestore user document updated for xyz789uvw012
```

### **Step 3: Verify Claims**

```bash
# Check the claims were set
npx ts-node src/scripts/setCustomClaims.ts get xyz789uvw012

# Output:
📋 User xyz789uvw012 claims: {
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users']
}
```

### **Step 4: Test Access**

The user will need to **log out and log back in** to get a new token with the updated claims. Then they can access admin endpoints!

## 🔄 **How Claims Work in Your System**

### **Frontend Token**
```typescript
// User logs in → Firebase returns token with claims
const token = await user.getIdToken()
// Token contains: {"role":"admin", "permissions":["read","write","delete","manage_users"]}
```

### **Backend Verification**
```typescript
// Backend reads claims from token
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
const isAdmin = payload.role === 'admin'
// User gets admin access if role === 'admin'
```

## ⚠️ **Important Notes**

### **Token Refresh**
- Users must **log out and log back in** to get new claims
- Claims are cached in tokens for 1 hour
- Force token refresh if needed: `await user.getIdToken(true)`

### **Security**
- Custom claims are **read-only** from client side
- Only Firebase Admin SDK can modify claims
- Claims are cryptographically signed in tokens

### **Best Practices**
- Use specific roles rather than boolean flags
- Keep permissions minimal and specific
- Update Firestore user documents for consistency
- Test thoroughly after changing claims

## 🛠️ **Troubleshooting**

### **User Still Gets 401 After Claims Set?**
1. User needs to log out and log back in
2. Check if claims were actually set: `npx ts-node src/scripts/setCustomClaims.ts get <uid>`
3. Verify backend is reading claims correctly

### **Script Not Working?**
1. Ensure `service-account.json` exists in backend root
2. Check Firebase project configuration
3. Verify user UID is correct

### **Claims Not Showing in Token?**
- Tokens are cached for 1 hour
- Force refresh: `await user.getIdToken(true)`
- Check network tab for new token payload

## 🎉 **Success!**

Once you set custom claims, users with admin roles will be able to access all admin endpoints without any 401 errors!

**Example workflow:**
1. Set admin claims for user
2. User logs out and logs back in  
3. User accesses admin pages → 200 OK ✅
4. All admin functionality works perfectly!

# 🔧 Custom Claims Complete Setup Guide

## 🎯 **3 Ways to Manage Custom Claims**

### **Method 1: Command Line Script (Quick & Easy)**

```bash
# Navigate to backend
cd backend

# Install ts-node (one time)
npm install -g ts-node

# Set user as admin
npx ts-node src/scripts/setCustomClaims.ts set-admin <USER_UID>

# Set user as student
npx ts-node src/scripts/setCustomClaims.ts set-student <USER_UID>

# Set user as teacher
npx ts-node src/scripts/setCustomClaims.ts set-teacher <USER_UID>

# List all users
npx ts-node src/scripts/setCustomClaims.ts list

# Get user claims
npx ts-node src/scripts/setCustomClaims.ts get <USER_UID>
```

### **Method 2: API Endpoints (Programmatic)**

**New endpoints available for super admins:**

```bash
# List all users with claims
GET /api/admin-management/users

# Set claims for a user
POST /api/admin-management/set-claims
{
  "uid": "USER_UID",
  "role": "admin",
  "permissions": ["read", "write", "delete", "manage_users"]
}

# Get specific user details
GET /api/admin-management/user/:uid

# Remove claims (reset to student)
DELETE /api/admin-management/user/:uid/claims

# Bulk update multiple users
POST /api/admin-management/bulk-set-claims
{
  "users": [
    {"uid": "uid1", "role": "admin", "permissions": ["all"]},
    {"uid": "uid2", "role": "student", "permissions": ["read", "write"]}
  ]
}
```

### **Method 3: Manual Code (Direct)**

```typescript
import { getAuth } from 'firebase-admin/auth'

const auth = getAuth()

// Set admin claims
await auth.setCustomUserClaims('USER_UID', {
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users']
})

// Remove claims
await auth.setCustomUserClaims('USER_UID', null)
```

## 🎭 **Available Roles**

### **Super Admin** (Highest)
```json
{
  "role": "super_admin",
  "permissions": ["all"]
}
```
- ✅ Can manage all users and claims
- ✅ Full system access
- ✅ Can use admin-management endpoints

### **Admin** (High)
```json
{
  "role": "admin",
  "permissions": ["read", "write", "delete", "manage_content"]
}
```
- ✅ Can access all admin endpoints
- ✅ Can create/edit content
- ❌ Cannot manage other users

### **Teacher** (Medium)
```json
{
  "role": "teacher",
  "permissions": ["read", "write", "manage_content"]
}
```
- ✅ Can create and manage content
- ❌ Cannot access admin areas
- ❌ Cannot manage users

### **Student** (Basic)
```json
{
  "role": "student",
  "permissions": ["read", "write"]
}
```
- ✅ Can submit answers and view content
- ❌ Cannot access admin areas
- ❌ Cannot manage content

## 📋 **Step-by-Step Example**

### **Step 1: Find User UID**

```bash
# List all users to find the UID
npx ts-node src/scripts/setCustomClaims.ts list

# Example output:
👥 Found 2 users:
- rahul@example.com (abc123def456): {"role":"student"}
- likhith@example.com (xyz789uvw012): null
```

### **Step 2: Make User Admin**

```bash
# Set rahul as admin
npx ts-node src/scripts/setCustomClaims.ts set-admin abc123def456

# Output:
✅ Custom claims set for user abc123def456: {
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users']
}
✅ Firestore user document updated for abc123def456
```

### **Step 3: Verify Claims**

```bash
# Check the claims
npx ts-node src/scripts/setCustomClaims.ts get abc123def456

# Output:
📋 User abc123def456 claims: {
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users']
}
```

### **Step 4: Test Access**

1. **User logs out and logs back in** (important!)
2. **User accesses admin pages** → Should work now!
3. **Check browser console** → No more 401 errors

## 🔄 **How It Works**

### **Token Flow**
```
User Login → Firebase → Token with Claims → Backend → Role Check → Access Granted/Denied
```

### **Claims in Token**
```json
// JWT Payload contains:
{
  "uid": "abc123def456",
  "email": "rahul@example.com",
  "role": "admin",           ← Custom claim
  "permissions": ["all"],   ← Custom claim
  "iss": "https://securetoken.google.com/your-project"
}
```

### **Backend Processing**
```typescript
// Backend reads claims from token
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
const isAdmin = payload.role === 'admin'  // ✅ True for admin users
```

## ⚠️ **Important Notes**

### **Token Refresh Required**
- Users must **log out and log back in** after claims change
- Tokens are cached for 1 hour
- Force refresh: `await user.getIdToken(true)`

### **Security Best Practices**
- Only super admins can manage other users' claims
- Claims are read-only from client side
- Always verify claims on backend (never trust frontend)

### **Common Issues**

#### **User Still Gets 401?**
1. User needs to log out and log back in
2. Check if claims were set correctly
3. Verify backend is reading claims properly

#### **Script Not Working?**
1. Ensure `service-account.json` exists
2. Check Firebase project configuration
3. Verify user UID is correct

## 🎉 **Success Indicators**

### **Working Setup**
- ✅ Admin users can access `/api/admin/*` endpoints
- ✅ Student users get 403 on admin endpoints (correct)
- ✅ No more 401 Unauthorized errors for admin users
- ✅ Custom claims visible in JWT tokens

### **Test Checklist**
- [ ] Set admin claims for user
- [ ] User logs out and logs back in
- [ ] User can access admin pages
- [ ] Student users still blocked from admin areas
- [ ] Backend logs show correct role detection

## 🚀 **You're All Set!**

You now have **3 complete methods** to manage Firebase custom claims:

1. **Command line script** - Quick and easy
2. **API endpoints** - Programmatic control  
3. **Direct code** - Full flexibility

**Choose the method that works best for your workflow!** 🎯

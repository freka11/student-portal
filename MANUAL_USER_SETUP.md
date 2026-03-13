# Manual User Setup Guide

Since Firebase Admin SDK is not configured, you'll need to create users manually in Firebase Console.

## 🔑 Your Test Users

### Students
- **Email**: `student1@student.com` → **Password**: `student123`
- **Email**: `student2@student.com` → **Password**: `student123`

### Teachers/Admins  
- **Email**: `teacher1@admin.com` → **Password**: `teacher123`
- **Email**: `teacher2@admin.com` → **Password**: `teacher123`

## 📋 Step-by-Step Setup

### 1. Go to Firebase Console
- URL: https://console.firebase.google.com
- Select your project: `student-portal-fab55`

### 2. Create Users in Authentication
1. Click **Authentication** in the left menu
2. Click **Get Started** (if not already set up)
3. Go to **Users** tab
4. Click **Add user**
5. Create each user with the credentials above:
   - Email: `student1@student.com`
   - Password: `student123`
   - Click **Add user**
6. Repeat for all 4 users

### 3. Create User Documents in Firestore
1. Click **Firestore Database** in the left menu
2. Go to **Data** tab
3. Click **Start collection** (if not exists)
4. Collection ID: `users`
5. Add each user as a document:
   ```javascript
   // Student 1
   {
     email: "student1@student.com",
     username: "student1", 
     name: "Student 1",
     role: "student",
     avatar: ""
   }
   
   // Student 2
   {
     email: "student2@student.com",
     username: "student2",
     name: "Student 2", 
     role: "student",
     avatar: ""
   }
   
   // Teacher 1
   {
     email: "teacher1@admin.com",
     username: "teacher1",
     name: "Teacher 1",
     role: "admin", 
     avatar: ""
   }
   
   // Teacher 2
   {
     email: "teacher2@admin.com",
     username: "teacher2",
     name: "Teacher 2",
     role: "admin",
     avatar: ""
   }
   ```

### 4. Test the Chat System
1. **Student Login**: http://localhost:3001/user/login
   - Username: `student1` / Password: `student123`
2. **Admin Login**: http://localhost:3002/admin/login  
   - Username: `teacher1` / Password: `teacher123`
3. Both should see each other in chat pages!

## 🚀 Quick Test Checklist
- [ ] Created 4 users in Firebase Authentication
- [ ] Created 4 user documents in Firestore `users` collection
- [ ] Can login as student1/student123
- [ ] Can login as teacher1/teacher123
- [ ] Student sees teachers in chat list
- [ ] Teacher sees students in chat list
- [ ] Can send messages between users

## 🔧 Troubleshooting

### "Failed to create session" Error
- This is normal since Admin SDK is not configured
- Login will still work with client-side Firebase Auth

### Users Not Showing in Chat
- Make sure Firestore `users` collection has all 4 user documents
- Check that `role` field is correct ("student" or "admin")
- Refresh the chat page after creating users

### Login Not Working
- Verify users exist in Firebase Authentication
- Check email/password are exactly as specified
- Make sure Firebase project ID matches your configuration

The chat system will work perfectly once you create these 4 users manually!

/**
 * Script to set custom claims for Firebase users
 * Usage: npx ts-node scripts/setCustomClaims.ts
 */

import { getAuth } from 'firebase-admin/auth'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
const serviceAccount = require('../service-account.json')

const app = initializeApp({
  credential: serviceAccount,
})

const auth = getAuth(app)
const db = getFirestore(app)

interface UserClaims {
  role: 'admin' | 'student' | 'teacher' | 'super_admin'
  permissions?: string[]
}

/**
 * Set custom claims for a user
 */
async function setCustomClaims(uid: string, claims: UserClaims) {
  try {
    await auth.setCustomUserClaims(uid, claims)
    console.log(`✅ Custom claims set for user ${uid}:`, claims)
    
    // Update user document in Firestore
    await db.collection('users').doc(uid).update({
      role: claims.role,
      permissions: claims.permissions || [],
      updatedAt: new Date(),
    })
    
    console.log(`✅ Firestore user document updated for ${uid}`)
  } catch (error) {
    console.error(`❌ Error setting claims for ${uid}:`, error)
  }
}

/**
 * Get current custom claims for a user
 */
async function getUserClaims(uid: string) {
  try {
    const user = await auth.getUser(uid)
    console.log(`📋 User ${uid} claims:`, user.customClaims)
    return user.customClaims
  } catch (error) {
    console.error(`❌ Error getting claims for ${uid}:`, error)
  }
}

/**
 * List all users and their claims
 */
async function listAllUsers() {
  try {
    const listUsers = await auth.listUsers()
    console.log(`👥 Found ${listUsers.users.length} users:`)
    
    listUsers.users.forEach(user => {
      console.log(`- ${user.email} (${user.uid}): ${JSON.stringify(user.customClaims)}`)
    })
  } catch (error) {
    console.error('❌ Error listing users:', error)
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'set-admin':
      const adminUid = args[1]
      if (!adminUid) {
        console.log('Usage: npx ts-node scripts/setCustomClaims.ts set-admin <uid>')
        return
      }
      await setCustomClaims(adminUid, {
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage_users']
      })
      break
      
    case 'set-student':
      const studentUid = args[1]
      if (!studentUid) {
        console.log('Usage: npx ts-node scripts/setCustomClaims.ts set-student <uid>')
        return
      }
      await setCustomClaims(studentUid, {
        role: 'student',
        permissions: ['read', 'write']
      })
      break
      
    case 'set-teacher':
      const teacherUid = args[1]
      if (!teacherUid) {
        console.log('Usage: npx ts-node scripts/setCustomClaims.ts set-teacher <uid>')
        return
      }
      await setCustomClaims(teacherUid, {
        role: 'teacher',
        permissions: ['read', 'write', 'manage_content']
      })
      break
      
    case 'get':
      const getUid = args[1]
      if (!getUid) {
        console.log('Usage: npx ts-node scripts/setCustomClaims.ts get <uid>')
        return
      }
      await getUserClaims(getUid)
      break
      
    case 'list':
      await listAllUsers()
      break
      
    default:
      console.log(`
🔧 Custom Claims Management Script

Usage:
  npx ts-node scripts/setCustomClaims.ts <command> [uid]

Commands:
  set-admin <uid>     - Set user as admin with full permissions
  set-student <uid>   - Set user as student with basic permissions  
  set-teacher <uid>   - Set user as teacher with content permissions
  get <uid>           - Get current claims for a user
  list                - List all users and their claims

Examples:
  npx ts-node scripts/setCustomClaims.ts set-admin abc123def456
  npx ts-node scripts/setCustomClaims.ts get abc123def456
  npx ts-node scripts/setCustomClaims.ts list
      `)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { setCustomClaims, getUserClaims, listAllUsers }

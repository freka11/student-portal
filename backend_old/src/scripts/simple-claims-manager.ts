/**
 * Simple Custom Claims Manager
 * Works without Firebase Admin SDK by using environment variables
 */

import fs from 'fs'
import path from 'path'

// Simple in-memory user database for demonstration
const CLAIMS_FILE = path.join(__dirname, '../../data/user-claims.json')

interface UserClaims {
  uid: string
  email: string
  role: 'admin' | 'student' | 'teacher' | 'super_admin'
  permissions: string[]
  updatedAt: string
}

/**
 * Ensure data directory and claims file exist
 */
function ensureClaimsFile() {
  const dataDir = path.dirname(CLAIMS_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  
  if (!fs.existsSync(CLAIMS_FILE)) {
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify({ users: [] }, null, 2))
  }
}

/**
 * Load all user claims
 */
function loadClaims(): { users: UserClaims[] } {
  ensureClaimsFile()
  try {
    const data = fs.readFileSync(CLAIMS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return { users: [] }
  }
}

/**
 * Save user claims
 */
function saveClaims(data: { users: UserClaims[] }) {
  ensureClaimsFile()
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(data, null, 2))
}

/**
 * Add or update user claims
 */
function setUserClaims(uid: string, email: string, role: UserClaims['role'], permissions: string[] = []) {
  const data = loadClaims()
  
  const existingUserIndex = data.users.findIndex(u => u.uid === uid)
  
  const userClaims: UserClaims = {
    uid,
    email,
    role,
    permissions: permissions.length > 0 ? permissions : getDefaultPermissions(role),
    updatedAt: new Date().toISOString()
  }
  
  if (existingUserIndex >= 0) {
    data.users[existingUserIndex] = userClaims
  } else {
    data.users.push(userClaims)
  }
  
  saveClaims(data)
  return userClaims
}

/**
 * Get default permissions for a role
 */
function getDefaultPermissions(role: UserClaims['role']): string[] {
  switch (role) {
    case 'super_admin':
      return ['all']
    case 'admin':
      return ['read', 'write', 'delete', 'manage_content']
    case 'teacher':
      return ['read', 'write', 'manage_content']
    case 'student':
      return ['read', 'write']
    default:
      return ['read']
  }
}

/**
 * Get user claims
 */
function getUserClaims(uid: string): UserClaims | null {
  const data = loadClaims()
  return data.users.find(u => u.uid === uid) || null
}

/**
 * List all users with claims
 */
function listAllUsers(): UserClaims[] {
  const data = loadClaims()
  return data.users
}

/**
 * Remove user claims
 */
function removeUserClaims(uid: string): boolean {
  const data = loadClaims()
  const initialLength = data.users.length
  data.users = data.users.filter(u => u.uid !== uid)
  saveClaims(data)
  return data.users.length < initialLength
}

// Command line interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'set-admin':
      const adminUid = args[1]
      const adminEmail = args[2] || `${adminUid}@example.com`
      if (!adminUid) {
        console.log('Usage: npx ts-node src/scripts/simple-claims-manager.ts set-admin <uid> [email]')
        return
      }
      const adminClaims = setUserClaims(adminUid, adminEmail, 'admin')
      console.log(`✅ Admin claims set for ${adminEmail} (${adminUid}):`, adminClaims)
      break
      
    case 'set-student':
      const studentUid = args[1]
      const studentEmail = args[2] || `${studentUid}@example.com`
      if (!studentUid) {
        console.log('Usage: npx ts-node src/scripts/simple-claims-manager.ts set-student <uid> [email]')
        return
      }
      const studentClaims = setUserClaims(studentUid, studentEmail, 'student')
      console.log(`✅ Student claims set for ${studentEmail} (${studentUid}):`, studentClaims)
      break
      
    case 'set-teacher':
      const teacherUid = args[1]
      const teacherEmail = args[2] || `${teacherUid}@example.com`
      if (!teacherUid) {
        console.log('Usage: npx ts-node src/scripts/simple-claims-manager.ts set-teacher <uid> [email]')
        return
      }
      const teacherClaims = setUserClaims(teacherUid, teacherEmail, 'teacher')
      console.log(`✅ Teacher claims set for ${teacherEmail} (${teacherUid}):`, teacherClaims)
      break
      
    case 'set-super-admin':
      const superUid = args[1]
      const superEmail = args[2] || `${superUid}@example.com`
      if (!superUid) {
        console.log('Usage: npx ts-node src/scripts/simple-claims-manager.ts set-super-admin <uid> [email]')
        return
      }
      const superClaims = setUserClaims(superUid, superEmail, 'super_admin')
      console.log(`✅ Super admin claims set for ${superEmail} (${superUid}):`, superClaims)
      break
      
    case 'get':
      const getUid = args[1]
      if (!getUid) {
        console.log('Usage: npx ts-node src/scripts/simple-claims-manager.ts get <uid>')
        return
      }
      const claims = getUserClaims(getUid)
      if (claims) {
        console.log(`📋 Claims for ${claims.email} (${getUid}):`, claims)
      } else {
        console.log(`❌ No claims found for user ${getUid}`)
      }
      break
      
    case 'list':
      const users = listAllUsers()
      console.log(`👥 Found ${users.length} users:`)
      users.forEach(user => {
        console.log(`- ${user.email} (${user.uid}): ${user.role} - ${user.permissions.join(', ')}`)
      })
      break
      
    case 'remove':
      const removeUid = args[1]
      if (!removeUid) {
        console.log('Usage: npx ts-node src/scripts/simple-claims-manager.ts remove <uid>')
        return
      }
      const removed = removeUserClaims(removeUid)
      if (removed) {
        console.log(`✅ Claims removed for user ${removeUid}`)
      } else {
        console.log(`❌ No claims found for user ${removeUid}`)
      }
      break
      
    default:
      console.log(`
🔧 Simple Custom Claims Manager

Usage:
  npx ts-node src/scripts/simple-claims-manager.ts <command> <uid> [email]

Commands:
  set-admin <uid> [email]     - Set user as admin
  set-student <uid> [email]   - Set user as student
  set-teacher <uid> [email]   - Set user as teacher
  set-super-admin <uid> [email] - Set user as super admin
  get <uid>                   - Get claims for a user
  list                        - List all users with claims
  remove <uid>                - Remove claims for a user

Examples:
  npx ts-node src/scripts/simple-claims-manager.ts set-admin rahul123 rahul@example.com
  npx ts-node src/scripts/simple-claims-manager.ts set-student likhith456 likhith@example.com
  npx ts-node src/scripts/simple-claims-manager.ts list
  npx ts-node src/scripts/simple-claims-manager.ts get rahul123

Note: This creates a local claims file at backend/src/data/user-claims.json
      `)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { setUserClaims, getUserClaims, listAllUsers, removeUserClaims }

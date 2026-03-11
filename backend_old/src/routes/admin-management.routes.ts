/**
 * Admin Management Routes - for managing user roles and claims
 * These endpoints should only be accessible by super admins
 */

import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken'
import { requireRole } from '../middleware/requireRole'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const router = Router()
const auth = getAuth()
const db = getFirestore()

// Apply authentication and super admin requirement
router.use(verifyFirebaseToken)
router.use(requireRole(['super_admin', 'admin']))

/**
 * GET /api/admin-management/users
 * List all users with their current claims
 */
router.get('/users', async (req, res) => {
  try {
    const listUsers = await auth.listUsers()
    const users = listUsers.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime,
      lastSignInAt: user.metadata.lastSignInTime,
      customClaims: user.customClaims || {}
    }))

    res.json({
      success: true,
      users,
      total: users.length
    })
  } catch (error) {
    console.error('Error listing users:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to list users'
    })
  }
})

/**
 * POST /api/admin-management/set-claims
 * Set custom claims for a user
 */
router.post('/set-claims', async (req, res) => {
  try {
    const { uid, role, permissions } = req.body

    if (!uid || !role) {
      return res.status(400).json({
        success: false,
        message: 'UID and role are required'
      })
    }

    // Validate role
    const validRoles = ['admin', 'student', 'teacher', 'super_admin']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: admin, student, teacher, or super_admin'
      })
    }

    // Set custom claims
    const claims: any = { role }
    if (permissions && Array.isArray(permissions)) {
      claims.permissions = permissions
    }

    await auth.setCustomUserClaims(uid, claims)

    // Update Firestore user document
    await db.collection('users').doc(uid).update({
      role,
      permissions: permissions || [],
      updatedAt: new Date(),
      updatedBy: req.user!.uid
    })

    // Get updated user info
    const updatedUser = await auth.getUser(uid)

    res.json({
      success: true,
      message: `Custom claims updated for user ${uid}`,
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        customClaims: updatedUser.customClaims
      }
    })
  } catch (error) {
    console.error('Error setting claims:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to set custom claims'
    })
  }
})

/**
 * GET /api/admin-management/user/:uid
 * Get specific user details and claims
 */
router.get('/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params
    const user = await auth.getUser(uid)

    // Get additional user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get()
    const userData = userDoc.exists ? userDoc.data() : {}

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime,
        lastSignInAt: user.metadata.lastSignInTime,
        customClaims: user.customClaims || {},
        firestoreData: userData
      }
    })
  } catch (error) {
    console.error('Error getting user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user details'
    })
  }
})

/**
 * DELETE /api/admin-management/user/:uid/claims
 * Remove custom claims from a user (resets to student)
 */
router.delete('/user/:uid/claims', async (req, res) => {
  try {
    const { uid } = req.params

    // Remove all custom claims
    await auth.setCustomUserClaims(uid, null)

    // Update Firestore to student role
    await db.collection('users').doc(uid).update({
      role: 'student',
      permissions: ['read', 'write'],
      updatedAt: new Date(),
      updatedBy: req.user!.uid
    })

    res.json({
      success: true,
      message: `Custom claims removed for user ${uid}, reset to student role`
    })
  } catch (error) {
    console.error('Error removing claims:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove custom claims'
    })
  }
})

/**
 * POST /api/admin-management/bulk-set-claims
 * Set claims for multiple users at once
 */
router.post('/bulk-set-claims', async (req, res) => {
  try {
    const { users } = req.body // Array of { uid, role, permissions }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Users array is required'
      })
    }

    const results = []

    for (const userClaim of users) {
      try {
        const { uid, role, permissions } = userClaim
        
        if (!uid || !role) {
          results.push({ uid, success: false, error: 'UID and role are required' })
          continue
        }

        const claims: any = { role }
        if (permissions && Array.isArray(permissions)) {
          claims.permissions = permissions
        }

        await auth.setCustomUserClaims(uid, claims)
        
        await db.collection('users').doc(uid).update({
          role,
          permissions: permissions || [],
          updatedAt: new Date(),
          updatedBy: req.user!.uid
        })

        results.push({ uid, success: true, role })
      } catch (error) {
        results.push({ uid: userClaim.uid, success: false, error: (error as Error).message })
      }
    }

    res.json({
      success: true,
      message: `Processed ${users.length} users`,
      results
    })
  } catch (error) {
    console.error('Error in bulk claims update:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update bulk claims'
    })
  }
})

export function createAdminManagementRouter() {
  return router
}

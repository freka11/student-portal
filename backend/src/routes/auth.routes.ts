import { Router } from 'express'
import { postAdminLogin, postUserLogin, postSession, getSession, verifyToken } from '../controllers/auth.controller'

const router = Router()

router.post('/admin-login', postAdminLogin)
router.post('/user-login', postUserLogin)
router.post('/session', postSession)
router.get('/session', getSession)
router.post('/verify', verifyToken)

export default router

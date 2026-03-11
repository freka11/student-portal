import { Router } from 'express'
import { postAdminLogin, postUserLogin, postSession, getSession } from '../controllers/auth.controller'

const router = Router()

router.post('/admin-login', postAdminLogin)
router.post('/user-login', postUserLogin)
router.post('/session', postSession)
router.get('/session', getSession)

export default router

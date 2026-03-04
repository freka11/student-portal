import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken'
import { requireRole } from '../middleware/requireRole'
import { QuestionService } from '../modules/questions/question.service'
import { ThoughtService } from '../modules/thoughts/thought.service'
import { AnswerService } from '../modules/answers/answer.service'
import { UserService } from '../modules/users/user.service'
import { ConversationService } from '../modules/conversations/conversation.service'

export function createAdminRouter() {
  const router = Router()

  router.use(verifyFirebaseToken)
  router.use(requireRole(['admin', 'super_admin', 'teacher']))

  // DASHBOARD - mirrors admin /api/thoughts + /api/questions behaviour for today
  router.get('/dashboard', async (_req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0]

      const thoughts = await ThoughtService.listByPublishDate(today)
      const questions = await new QuestionService().listByPublishDate(today)

      res.json({
        success: true,
        today,
        thought: thoughts[0] ?? null,
        questions,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  })

  // GET thoughts - mirror student-admin /api/thoughts
  router.get("/thoughts", async (req, res, next) => {
    try {
      const dateFilter = req.query.date as string | undefined

      if (dateFilter === "all") {
        const thoughts = await ThoughtService.listAll()
        return res.json(thoughts)
      }

      const today = new Date().toISOString().split("T")[0]
      const thoughts = await ThoughtService.listByPublishDate(today)

      res.json(thoughts)
    } catch (error) {
      next(error)
    }
  })

  // CREATE thought (accepts both "text" and "thought" for API compatibility)
  router.post("/thoughts", async (req, res, next) => {
    try {
      const text = req.body.text ?? req.body.thought

      if (!text || (typeof text === 'string' && text.trim() === "")) {
        return res.status(400).json({
          success: false,
          message: "Thought is empty",
        })
      }

      const createdBy = {
        uid: req.user!.uid,
        name: req.user!.email?.split("@")[0] || "Default User",
      }

      const result = await ThoughtService.create({
        text: String(text).trim(),
        createdBy,
      })

      res.status(201).json({
        success: true,
        message: "Thought saved successfully",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  })

  // UPDATE thought
  router.put("/thoughts/:id", async (req, res, next) => {
    try {
      const { id } = req.params
      const { text } = req.body

      if (!text || text.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Text is required",
        })
      }

      const result = await ThoughtService.update(id, text.trim())

      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  })

  // DELETE thought
  router.delete("/thoughts/:id", async (req, res, next) => {
    try {
      const { id } = req.params

      const result = await ThoughtService.softDelete(id)

      res.json({
        success: true,
        message: "Thought deleted successfully",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  })
  // QUESTIONS - admin CRUD, mirroring student-admin /api/questions

  router.get('/questions', async (req, res, next) => {
    try {
      const dateFilter = req.query.date as string | undefined
      const service = new QuestionService()

      if (dateFilter === 'all') {
        const questions = await service.listAll()
        return res.json(questions)
      }

      const today = new Date().toISOString().split('T')[0]
      const questions = await service.listByPublishDate(today)
      res.json(questions)
    } catch (error) {
      next(error)
    }
  })

  router.post("/questions", async (req, res, next) => {
    try {
      const text = req.body.text ?? req.body.question
      const { status } = req.body;

      if (!text || (typeof text === 'string' && text.trim() === "")) {
        return res.status(400).json({
          success: false,
          message: "Question text is required",
        });
      }

      const questionService = new QuestionService();

      const result = await questionService.create({
        text: String(text).trim(),
        status,
        createdBy: {
          uid: req.user!.uid,
          name: req.user!.email?.split("@")[0] || "Admin",
        },
      });

      res.status(201).json({
        success: true,
        message: "Question created successfully",
        data: result,
      });

    } catch (error) {
      next(error);
    }
  });

  router.put("/questions/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const text = req.body.text ?? req.body.question;
      const { status } = req.body;

      if (!text || (typeof text === 'string' && text.trim() === "")) {
        return res.status(400).json({
          success: false,
          message: "Text is required",
        });
      }

      const questionService = new QuestionService();
      await questionService.update(id, String(text).trim());
      if (status === 'draft' || status === 'published') {
        await questionService.updateStatus(id, status);
      }
      const result = { id };

      res.json({ success: true, data: result });

    } catch (error) {
      next(error);
    }
  });



  router.delete("/questions/:id", async (req, res, next) => {
    try {
      const { id } = req.params;

      const questionService = new QuestionService();
      const result = await questionService.softDelete(id);

      res.json({
        success: true,
        message: "Question deleted successfully",
        data: result,
      });

    } catch (error) {
      next(error);
    }
  });

  router.patch("/questions/:id/status", async (req, res, next) => {
    try {
      const { id } = req.params
      const { status } = req.body as { status?: 'draft' | 'published' }

      if (status !== 'draft' && status !== 'published') {
        return res.status(400).json({
          success: false,
          message: 'Status must be draft or published',
        })
      }

      const questionService = new QuestionService()
      const result = await questionService.updateStatus(id, status)

      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  })

  // ANSWERS - admin: GET all, DELETE (mirrors student-admin /api/answers)
  const answerService = new AnswerService()

  router.get('/answers', async (_req, res, next) => {
    try {
      const answers = await answerService.listAll()
      res.json(answers)
    } catch (error) {
      next(error)
    }
  })

  // DELETE by id in path or query (for compatibility with Next.js API)
  router.delete(['/answers', '/answers/:id'], async (req, res, next) => {
    try {
      const id = (req.params.id ?? req.query.id) as string
      if (!id) {
        return res.status(400).json({ success: false, message: 'Answer ID is required' })
      }
      await answerService.delete(id)
      res.json({ success: true, message: 'Answer deleted successfully' })
    } catch (error) {
      next(error)
    }
  })

  // USERS - administration
  const userService = new UserService()

  router.get('/users', async (_req, res, next) => {
    try {
      const users = await userService.listAll()
      res.json({
        success: true,
        message: 'Users retrieved successfully',
        users,
      })
    } catch (error) {
      next(error)
    }
  })

  router.post('/users/create-teacher', async (req, res, next) => {
    try {
      const { email, password, name } = req.body
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' })
      }
      const user = await userService.createTeacher({ email, password, name })
      res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        user,
      })
    } catch (error) {
      next(error)
    }
  })

  // Promote user to super admin
  router.post('/users/promote-superadmin', requireRole(['super_admin']), async (req, res, next) => {
    try {
      const { uid } = req.body
      if (!uid) {
        return res.status(400).json({ success: false, message: 'User UID is required' })
      }
      const result = await userService.promoteToSuperAdmin(uid)
      res.json(result)
    } catch (error) {
      next(error)
    }
  })

  // Setup users (migrated from Next.js setup-users)
  router.get('/setup/users', async (req, res, next) => {
    try {
      const users = await userService.listAll()
      const students = users.filter(u => u.role === 'student')
      const admins = users.filter(u => u.role === 'admin' || u.role === 'super_admin')

      res.json({
        success: true,
        totalUsers: users.length,
        students,
        admins
      })
    } catch (error) {
      next(error)
    }
  })

  router.post('/setup/users', async (req, res, next) => {
    try {
      const results = await userService.setupUsers()
      const successCount = results.filter(r => r.status === 'success').length

      res.json({
        success: true,
        message: 'Setup completed',
        results,
        totalUsers: results.length,
        successCount
      })
    } catch (error) {
      next(error)
    }
  })

  // CONVERSATIONS - administration
  const conversationService = new ConversationService()

  router.post('/conversations/assign', async (req, res, next) => {
    try {
      const { conversationId, teacherId, assignedBy } = req.body
      if (!conversationId) {
        return res.status(400).json({ success: false, message: 'Conversation ID is required' })
      }

      if (teacherId) {
        const result = await conversationService.assignTeacher({
          conversationId,
          teacherId,
          assignedBy,
        })
        res.json({
          success: true,
          message: 'Conversation assigned successfully',
          assignment: {
            conversationId,
            assignedTeacherId: teacherId,
            assignedTeacherName: result.teacherName,
            status: 'assigned',
          },
        })
      } else {
        await conversationService.unassignTeacher(conversationId)
        res.json({
          success: true,
          message: 'Conversation unassigned successfully',
          assignment: {
            conversationId,
            assignedTeacherId: null,
            assignedTeacherName: null,
            status: 'unassigned',
          },
        })
      }
    } catch (error) {
      next(error)
    }
  })

  return router
}

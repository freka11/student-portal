import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken'
import { requireRole } from '../middleware/requireRole'
import { QuestionService } from '../modules/questions/question.service'
import { ThoughtService } from '../modules/thoughts/thought.service'

export function createAdminRouter() {
  const router = Router()

  router.use(verifyFirebaseToken)
  router.use(requireRole(['admin', 'super_admin', 'teacher']))

  // DASHBOARD
  router.get('/dashboard/today', async (_req, res) => {
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

  // GET thoughts
  router.get("/thoughts", async (req, res, next) => {
    try {
      const dateFilter = req.query.date as string | undefined

      if (dateFilter === "all") {
        const thoughts = await ThoughtService.listAll()
        return res.json({ success: true, data: thoughts })
      }

      const today = new Date().toISOString().split("T")[0]
      const thoughts = await ThoughtService.listByPublishDate(today)

      res.json({ success: true, data: thoughts })
    } catch (error) {
      next(error)
    }
  })

  // CREATE thought
  router.post("/thoughts", async (req, res, next) => {
    try {
      const { text } = req.body

      if (!text || text.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Thought text is required",
        })
      }

      const createdBy = {
        uid: req.user!.uid,
        name: req.user!.email?.split("@")[0] || "Admin",
      }

      const result = await ThoughtService.create({
        text: text.trim(),
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
// QUESTION

router.post("/questions", async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Question text is required",
      });
    }

    const questionService = new QuestionService();

    const result = await questionService.create({
      text: text.trim(),
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
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    const questionService = new QuestionService();
    const result = await questionService.update(id, text.trim());

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

router.get("/questions", async (req, res, next) => {
  try {
   

    const questionService = new QuestionService();
    const result = await questionService.listAll();

    res.json({
      success: true,
      message: "Questions fetched successfully",
      data: result,
    });

  } catch (error) {
    next(error);
  }
});




  return router
}
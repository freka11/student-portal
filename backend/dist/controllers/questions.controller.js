"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuestions = getQuestions;
exports.createQuestion = createQuestion;
exports.updateQuestion = updateQuestion;
exports.deleteQuestion = deleteQuestion;
exports.patchQuestion = patchQuestion;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
// ─── GET /api/questions ─────────────────────────────────────────────
async function getQuestions(req, res) {
    try {
        const dateFilter = req.query.date;
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
        const questionsQuery = firebaseAdmin_1.adminFirestore.collection('questions');
        if (dateFilter === 'all') {
            const snapshot = await questionsQuery.get();
            const questions = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((q) => isAdmin ? q.deleted !== true : (q.status === 'published' && q.deleted !== true));
            res.json(questions);
        }
        else {
            const today = new Date().toISOString().split('T')[0];
            const snapshot = await questionsQuery
                .where('publishDate', '==', today)
                .get();
            const questions = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((q) => isAdmin ? q.deleted !== true : (q.status === 'published' && q.deleted !== true));
            res.json(questions);
        }
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json([]);
    }
}
// ─── POST /api/questions (admin auth required) ─────────────────────
async function createQuestion(req, res) {
    try {
        const { question } = req.body;
        if (!question || question.trim() === '') {
            res.status(400).json({ success: false, message: 'Question text is required' });
            return;
        }
        const user = req.user;
        const questionDoc = {
            text: question,
            status: 'published',
            deleted: false,
            createdBy: {
                uid: user.uid,
                name: user.name,
            },
            createdAt: new Date().toISOString(),
            publishDate: new Date().toISOString().split('T')[0],
        };
        const docRef = await firebaseAdmin_1.adminFirestore.collection('questions').add(questionDoc);
        res.status(201).json({
            success: true,
            message: 'Question saved successfully',
            data: { id: docRef.id, ...questionDoc },
        });
    }
    catch (error) {
        console.error('Error saving question:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save question',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// ─── PUT /api/questions?id=xxx ──────────────────────────────────────
async function updateQuestion(req, res) {
    try {
        const questionId = req.query.id;
        const { text } = req.body;
        if (!questionId) {
            res.status(400).json({ success: false, message: 'Question ID is required' });
            return;
        }
        if (!text || text.trim() === '') {
            res.status(400).json({ success: false, message: 'Question text is required' });
            return;
        }
        await firebaseAdmin_1.adminFirestore.collection('questions').doc(questionId).update({
            text: text.trim(),
            updatedAt: new Date().toISOString(),
        });
        res.json({ success: true, message: 'Question updated successfully' });
    }
    catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ success: false, message: 'Failed to update question' });
    }
}
// ─── DELETE /api/questions?id=xxx ───────────────────────────────────
async function deleteQuestion(req, res) {
    try {
        const questionId = req.query.id;
        if (!questionId) {
            res.status(400).json({ success: false, message: 'Question ID is required' });
            return;
        }
        await firebaseAdmin_1.adminFirestore.collection('questions').doc(questionId).update({
            deleted: true,
            updatedAt: new Date().toISOString(),
        });
        res.json({ success: true, message: 'Question deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ success: false, message: 'Failed to delete question' });
    }
}
// ─── PATCH /api/questions?id=xxx ────────────────────────────────────
async function patchQuestion(req, res) {
    try {
        const questionId = req.query.id;
        const updates = req.body;
        if (!questionId) {
            res.status(400).json({ success: false, message: 'Question ID is required' });
            return;
        }
        const allowedFields = ['text', 'status', 'deleted', 'publishDate'];
        const sanitizedUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                sanitizedUpdates[key] = updates[key];
            }
        }
        sanitizedUpdates.updatedAt = new Date().toISOString();
        await firebaseAdmin_1.adminFirestore.collection('questions').doc(questionId).update(sanitizedUpdates);
        res.json({ success: true, message: 'Question updated successfully' });
    }
    catch (error) {
        console.error('Error patching question:', error);
        res.status(500).json({ success: false, message: 'Failed to update question' });
    }
}
//# sourceMappingURL=questions.controller.js.map
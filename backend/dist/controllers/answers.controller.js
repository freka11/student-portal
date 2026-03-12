"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnswersAdmin = getAnswersAdmin;
exports.deleteAnswerAdmin = deleteAnswerAdmin;
exports.getStudentAnswers = getStudentAnswers;
exports.submitAnswer = submitAnswer;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
function toDateKey(date) {
    return date.toISOString().split('T')[0];
}
function addDays(dateKey, days) {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return toDateKey(dt);
}
// ─── GET /api/answers (admin — all answers) ─────────────────────────
async function getAnswersAdmin(req, res) {
    try {
        const snapshot = await firebaseAdmin_1.adminFirestore.collection('answers').get();
        const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(answers);
    }
    catch (error) {
        console.error('Error reading answers:', error);
        res.status(500).json([]);
    }
}
// ─── DELETE /api/answers?id=xxx (admin) ─────────────────────────────
async function deleteAnswerAdmin(req, res) {
    try {
        const answerId = req.query.id;
        if (!answerId) {
            res.status(400).json({ success: false, message: 'Answer ID is required' });
            return;
        }
        await firebaseAdmin_1.adminFirestore.collection('answers').doc(answerId).delete();
        res.json({ success: true, message: 'Answer deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting answer:', error);
        res.status(500).json({ success: false, message: 'Failed to delete answer' });
    }
}
// ─── GET /api/student/answers (student auth) ────────────────────────
async function getStudentAnswers(req, res) {
    try {
        const user = req.user;
        const all = req.query.all === 'true';
        if (all) {
            const snapshot = await firebaseAdmin_1.adminFirestore
                .collection('answers')
                .orderBy('submittedAt', 'desc')
                .get();
            const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.json(answers);
            return;
        }
        // Fetch only current student's answers
        const snapshot = await firebaseAdmin_1.adminFirestore
            .collection('answers')
            .where('studentId', '==', user.uid)
            .get();
        const answers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(answers);
    }
    catch (error) {
        console.error('Error fetching answers:', error);
        res.status(500).json([]);
    }
}
// ─── POST /api/student/answers (student auth) ──────────────────────
async function submitAnswer(req, res) {
    try {
        const user = req.user;
        const answerData = req.body;
        if (!answerData.questionId || !answerData.answer) {
            res.status(400).json({ success: false, message: 'Missing required fields: questionId, answer' });
            return;
        }
        // Validate question exists and is published
        const questionSnap = await firebaseAdmin_1.adminFirestore.collection('questions').doc(answerData.questionId).get();
        const question = questionSnap.exists ? questionSnap.data() : null;
        const isDeleted = question?.deleted === true;
        const status = typeof question?.status === 'string' ? question.status : null;
        if (!question || isDeleted || status !== 'published') {
            res.status(400).json({ success: false, message: 'Question is not available for answering' });
            return;
        }
        // Check if user already answered this question
        const existingAnswerSnap = await firebaseAdmin_1.adminFirestore
            .collection('answers')
            .where('studentId', '==', user.uid)
            .where('questionId', '==', answerData.questionId)
            .get();
        if (!existingAnswerSnap.empty) {
            res.status(409).json({ success: false, message: 'You have already answered this question.' });
            return;
        }
        // Create answer document
        const answerDoc = {
            studentId: user.uid,
            studentName: user.name,
            questionId: answerData.questionId,
            answer: answerData.answer,
            submittedAt: new Date().toISOString(),
            publishDate: answerData.publishDate || new Date().toISOString().split('T')[0],
        };
        const docRef = await firebaseAdmin_1.adminFirestore.collection('answers').add(answerDoc);
        // Update streak counter transactionally
        const todayKey = toDateKey(new Date());
        const yesterdayKey = addDays(todayKey, -1);
        const streakRef = firebaseAdmin_1.adminFirestore.collection('streak').doc(user.uid);
        const streakResult = await firebaseAdmin_1.adminFirestore.runTransaction(async (tx) => {
            const snap = await tx.get(streakRef);
            const existing = snap.exists ? snap.data() : null;
            const lastAnsweredDate = typeof existing?.lastAnsweredDate === 'string' ? existing.lastAnsweredDate : null;
            const prevCount = typeof existing?.streakCount === 'number' && Number.isFinite(existing.streakCount)
                ? existing.streakCount
                : 0;
            let nextCount = prevCount;
            let nextLast = lastAnsweredDate;
            if (lastAnsweredDate === todayKey) {
                nextCount = prevCount;
                nextLast = lastAnsweredDate;
            }
            else if (lastAnsweredDate === yesterdayKey) {
                nextCount = prevCount + 1;
                nextLast = todayKey;
            }
            else {
                nextCount = 1;
                nextLast = todayKey;
            }
            tx.set(streakRef, {
                studentId: user.uid,
                studentName: user.name,
                streakCount: nextCount,
                lastAnsweredDate: nextLast,
            }, { merge: true });
            return { streakCount: nextCount, lastAnsweredDate: nextLast };
        });
        res.status(201).json({
            success: true,
            message: 'Answer submitted successfully',
            id: docRef.id,
            streak: streakResult,
        });
    }
    catch (error) {
        console.error('Error saving answer:', error);
        res.status(500).json({ success: false, message: 'Failed to submit answer' });
    }
}
//# sourceMappingURL=answers.controller.js.map
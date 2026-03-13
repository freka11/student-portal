"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStreak = getStreak;
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
// ─── GET /api/student/streak ────────────────────────────────────────
async function getStreak(req, res) {
    try {
        const user = req.user;
        const questionsSnap = await firebaseAdmin_1.adminFirestore
            .collection('questions')
            .where('status', '==', 'published')
            .get();
        const validQuestionIds = new Set();
        for (const doc of questionsSnap.docs) {
            const q = doc.data();
            if (q?.deleted === true)
                continue;
            validQuestionIds.add(doc.id);
        }
        const answersSnap = await firebaseAdmin_1.adminFirestore
            .collection('answers')
            .where('studentId', '==', user.uid)
            .get();
        const answeredDays = new Set();
        for (const doc of answersSnap.docs) {
            const ans = doc.data();
            const questionId = typeof ans?.questionId === 'string' ? ans.questionId : null;
            if (!questionId || !validQuestionIds.has(questionId))
                continue;
            const submittedAt = typeof ans?.submittedAt === 'string' ? ans.submittedAt : null;
            const publishDate = typeof ans?.publishDate === 'string' ? ans.publishDate : null;
            const dayKey = submittedAt ? submittedAt.split('T')[0] : publishDate;
            if (dayKey)
                answeredDays.add(dayKey);
        }
        const sortedDays = Array.from(answeredDays).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
        const lastAnsweredDate = sortedDays.length > 0 ? sortedDays[0] : null;
        let streakCount = 0;
        if (lastAnsweredDate) {
            streakCount = 1;
            let cursor = lastAnsweredDate;
            while (true) {
                const prev = addDays(cursor, -1);
                if (!answeredDays.has(prev))
                    break;
                streakCount += 1;
                cursor = prev;
            }
        }
        await firebaseAdmin_1.adminFirestore
            .collection('streak')
            .doc(user.uid)
            .set({
            studentId: user.uid,
            studentName: user.name,
            streakCount,
            lastAnsweredDate,
        }, { merge: true });
        res.json({
            success: true,
            streak: {
                studentId: user.uid,
                studentName: user.name,
                streakCount,
                lastAnsweredDate,
            },
        });
    }
    catch (error) {
        console.error('Error fetching streak:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch streak' });
    }
}
//# sourceMappingURL=streak.controller.js.map
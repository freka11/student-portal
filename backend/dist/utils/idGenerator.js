"use strict";
// Public ID generation utility for sequential IDs
// Uses Firestore transactions to ensure no duplicate IDs
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePublicId = generatePublicId;
exports.getRolePrefix = getRolePrefix;
exports.initializeCounters = initializeCounters;
exports.getCounterValues = getCounterValues;
exports.parsePublicId = parsePublicId;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Generate a sequential public ID for a given role
 */
async function generatePublicId(role) {
    const counterId = getCounterId(role);
    const counterRef = firebaseAdmin_1.adminFirestore.collection('counters').doc(counterId);
    try {
        const result = await firebaseAdmin_1.adminFirestore.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists) {
                throw new Error(`Counter ${counterId} does not exist. Please run setup-counters first.`);
            }
            const counterData = counterDoc.data();
            const nextNumber = counterData.lastNumber + 1;
            const publicId = `${counterData.prefix}-${nextNumber.toString().padStart(4, '0')}`;
            transaction.update(counterRef, {
                lastNumber: nextNumber,
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
            return publicId;
        });
        console.log(`✅ Generated ${role} public ID: ${result}`);
        return result;
    }
    catch (error) {
        console.error(`❌ Error generating public ID for ${role}:`, error);
        throw new Error(`Failed to generate public ID for ${role}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function getCounterId(role) {
    switch (role) {
        case 'student': return 'studentCounter';
        case 'teacher': return 'teacherCounter';
        case 'super_admin': return 'superAdminCounter';
        case 'admin': return 'adminCounter';
        default: throw new Error(`Unknown role: ${role}`);
    }
}
function getRolePrefix(role) {
    switch (role) {
        case 'student': return 'STU';
        case 'teacher': return 'TCH';
        case 'super_admin': return 'SUP';
        case 'admin': return 'ADM';
        default: throw new Error(`Unknown role: ${role}`);
    }
}
async function initializeCounters() {
    const counters = [
        { id: 'studentCounter', lastNumber: 0, prefix: 'STU' },
        { id: 'adminCounter', lastNumber: 0, prefix: 'ADM' },
        { id: 'teacherCounter', lastNumber: 0, prefix: 'TCH' },
        { id: 'superAdminCounter', lastNumber: 0, prefix: 'SUP' }
    ];
    const batch = firebaseAdmin_1.adminFirestore.batch();
    for (const counter of counters) {
        const counterRef = firebaseAdmin_1.adminFirestore.collection('counters').doc(counter.id);
        batch.set(counterRef, {
            lastNumber: counter.lastNumber,
            prefix: counter.prefix,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    await batch.commit();
    console.log('✅ Counters initialized successfully');
}
async function getCounterValues() {
    const countersSnapshot = await firebaseAdmin_1.adminFirestore.collection('counters').get();
    const counters = {};
    countersSnapshot.forEach(doc => {
        const data = doc.data();
        counters[doc.id] = {
            lastNumber: data.lastNumber,
            prefix: data.prefix
        };
    });
    return counters;
}
function parsePublicId(publicId) {
    const match = publicId.match(/^([A-Z]+)-(\d+)$/);
    if (!match)
        return null;
    const prefix = match[1];
    const number = parseInt(match[2], 10);
    const prefixToRole = {
        'STU': 'student',
        'TCH': 'teacher',
        'SUP': 'super_admin',
        'ADM': 'admin'
    };
    const role = prefixToRole[prefix];
    if (!role)
        return null;
    return { role, number };
}
//# sourceMappingURL=idGenerator.js.map
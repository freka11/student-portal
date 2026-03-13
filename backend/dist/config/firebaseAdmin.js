"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFirestore = exports.adminAuth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
if (!firebase_admin_1.default.apps.length) {
    // Prefer a local service-account JSON when available, since multiline private keys
    // in .env files are easy to mangle on Windows.
    const workspaceRoot = node_path_1.default.resolve(process.cwd(), '..');
    const fallbackPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
        node_path_1.default.join(workspaceRoot, 'student-portal-fab55-firebase-adminsdk-fbsvc-0440910da3.json');
    if (node_fs_1.default.existsSync(fallbackPath)) {
        const raw = node_fs_1.default.readFileSync(fallbackPath, 'utf8');
        const serviceAccount = JSON.parse(raw);
        console.log('🔐 Firebase Admin credential source: service account JSON');
        console.log('   Path:', fallbackPath);
        console.log('   project_id:', serviceAccount.project_id);
        console.log('   client_email:', serviceAccount.client_email);
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey: serviceAccount.private_key,
            }),
        });
        console.log('✅ Firebase Admin SDK initialized successfully');
    }
    else {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        const formattedPrivateKey = privateKey
            ? privateKey.replace(/\\n/g, '\n').replace(/"/g, '')
            : undefined;
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        try {
            if (!projectId || !clientEmail || !formattedPrivateKey) {
                throw new Error('Missing Firebase Admin SDK credentials in environment variables');
            }
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: formattedPrivateKey,
                }),
            });
            console.log('🔐 Firebase Admin credential source: env vars');
            console.log('   FIREBASE_PROJECT_ID:', projectId);
            console.log('   FIREBASE_CLIENT_EMAIL:', clientEmail);
            console.log('✅ Firebase Admin SDK initialized successfully');
        }
        catch (err) {
            throw err;
        }
    }
}
exports.adminAuth = firebase_admin_1.default.auth();
exports.adminFirestore = firebase_admin_1.default.firestore();
exports.default = firebase_admin_1.default;
//# sourceMappingURL=firebaseAdmin.js.map
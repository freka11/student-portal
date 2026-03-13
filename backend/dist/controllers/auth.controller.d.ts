import { Request, Response } from 'express';
export declare function postAdminLogin(req: Request, res: Response): Promise<void>;
export declare function postUserLogin(req: Request, res: Response): Promise<void>;
export declare function postSession(req: Request, res: Response): Promise<void>;
export declare function getSession(req: Request, res: Response): Promise<void>;
export declare function verifyToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.controller.d.ts.map
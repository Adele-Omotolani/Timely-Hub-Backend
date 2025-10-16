import { Request, Response, NextFunction } from "express";
import { IUser } from "../model/userModel";
import "dotenv/config";
interface AuthRequest extends Request {
    user?: IUser;
}
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=authMiddleware.d.ts.map
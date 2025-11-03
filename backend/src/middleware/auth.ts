import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { Request, Response, NextFunction } from 'express';

export const protect = async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
    try {
        const token = (req as any).cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Não autorizado: Token ausente" });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const userId = decoded.userId;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(401).json({ message: "Não autorizado: Usuário não encontrado" });
        }
        
        req.userId = userId;
        next();

    } catch (error) {
        return res.status(401).json({ message: "Não autorizado: Token inválido" });
    }
};
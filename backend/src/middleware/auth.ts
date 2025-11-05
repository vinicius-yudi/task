import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export interface CustomRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

// Middleware de proteção que verifica se o usuário está autenticado via JWT
export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }
  
    // Verifica e decodifica o token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    // Busca o usuário no banco de dados usando o ID do token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    (req as CustomRequest).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Middleware que verifica se o usuário tem permissão baseada em roles
export const checkRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as CustomRequest).user;

    if (!user) {
      return res.status(403).json({ message: "Acesso negado: Usuário não autenticado." });
    }

    if (allowedRoles.includes(user.role)) {
      next();
    } else {
      return res.status(403).json({ message: `Acesso negado: Requer uma das seguintes roles: ${allowedRoles.join(', ')}.` });
    }
  };
};
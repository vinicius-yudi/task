import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { CustomRequest } from './auth';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    
    if (!customReq.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userRole = customReq.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não tem permissão para esta ação.' 
      });
    }

    next();
  };
}
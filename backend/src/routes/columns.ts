import express from 'express';
import { protect, checkRole, CustomRequest } from '../middleware/auth';
import { Role } from '@prisma/client';
import { prisma } from '../db';

const router = express.Router();

// Rota acessível por ADMIN e DEV
// Requer boardId para buscar colunas de um board específico
router.get('/', protect, async (req, res) => {
    try {
        const userId = (req as CustomRequest).user!.id;
        const { boardId } = req.query;

        if (!boardId || typeof boardId !== 'string') {
            return res.status(400).json({ message: 'ID do board é obrigatório' });
        }
        
        // Verificar se o board existe e se o usuário tem acesso (owner OU board principal do admin)
        const board = await prisma.board.findFirst({
            where: { id: boardId },
            select: { id: true, userId: true, isMainBoard: true }
        });
        
        // Acesso negado se: board não existe OU (não é o board principal E o usuário não é o owner)
        if (!board || (!board.isMainBoard && board.userId !== userId)) {
            return res.status(403).json({ message: 'Acesso negado ao board ou board não encontrado' });
        }
        
        const isCurrentBoardMain = board.isMainBoard;

        // Filtra as colunas do board e suas tarefas
        const columnsWithTasks = await prisma.column.findMany({
            where: { boardId },
            orderBy: { order: 'asc' },
            include: {
                tasks: {
                    orderBy: { order: 'asc' },
                    // Regra de visibilidade de Tarefas: 
                    // Se for o Board Principal (Admin), mostra todas as tarefas criadas.
                    // Senão (Board Pessoal), mostra apenas as tarefas criadas pelo usuário logado.
                    where: isCurrentBoardMain ? {} : { userId },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        done: true,
                        createdAt: true,
                        updatedAt: true,
                        userId: true, 
                        columnId: true,
                        order: true,
                    }
                },
            },
        });
        
        res.json(columnsWithTasks);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar colunas' });
    }
});

// Rota para criar uma nova coluna (ADMIN)
router.post('/', protect, async (req, res) => {
    try {
        const { title, boardId } = req.body;
        const userId = (req as CustomRequest).user!.id;

        if (!title || !boardId) {
            return res.status(400).json({ message: 'Título e ID do board são obrigatórios' });
        }
        
        // 1. Verificar se o board pertence ao usuário (só o owner pode adicionar colunas)
        const board = await prisma.board.findFirst({
            where: { id: boardId, userId },
        });

        if (!board) {
            return res.status(403).json({ message: 'Acesso negado: Somente o owner do board pode criar colunas.' });
        }


        // Define a ordem da nova coluna como a próxima disponível no BOARD
        const maxOrderColumn = await prisma.column.findFirst({
            where: { boardId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const newOrder = (maxOrderColumn?.order || 0) + 1;

        const column = await prisma.column.create({
            data: {
                title,
                order: newOrder,
                boardId, // Usa boardId
            },
        });

        res.status(201).json(column);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar coluna' });
    }
});

// Rota para atualizar uma coluna (ADMIN)
router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = (req as CustomRequest).user!.id;

        if (!id) { return res.status(400).json({ message: 'ID da coluna é obrigatório' }); }

        // 1. Busca a coluna e o board para garantir que a coluna pertence a um board do usuário
        const column = await prisma.column.findFirst({
            where: { id },
            include: { board: { select: { userId: true } } }
        });

        // Apenas o owner do board (userId) pode editar a coluna
        if (!column || !column.board || column.board.userId !== userId) {
            return res.status(403).json({ message: 'Acesso negado: Somente o owner do board pode editar colunas.' });
        }

        const updatedColumn = await prisma.column.update({
            where: { id: id },
            data: { title },
        });

        return res.json(updatedColumn);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao atualizar coluna' });
    }
});

// Rota para deletar uma coluna (ADMIN)
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req as CustomRequest).user!.id;

        if (!id) { return res.status(400).json({ message: 'ID da coluna é obrigatório' }); }

        // 1. Busca a coluna e o board para garantir que a coluna pertence a um board do usuário
        const column = await prisma.column.findFirst({
            where: { id },
            select: { id: true, boardId: true, order: true, board: { select: { userId: true } } }
        });

        // Apenas o owner do board (userId) pode deletar a coluna
        if (!column || !column.board || column.board.userId !== userId) {
            return res.status(403).json({ message: 'Acesso negado: Somente o owner do board pode deletar colunas.' });
        }

        await prisma.$transaction(async (prisma) => {
            await prisma.task.deleteMany({ where: { columnId: id } });
            await prisma.column.delete({ where: { id } });

            // Reordena as colunas restantes no board
            await prisma.column.updateMany({
                where: { boardId: column.boardId, order: { gt: column.order } },
                data: { order: { decrement: 1 } },
            });
        });

        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao deletar coluna' });
    }
});

export default router;
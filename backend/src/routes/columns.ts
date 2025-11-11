import express from 'express';
import { protect, checkRole, CustomRequest } from '../middleware/auth';
import { Role } from '@prisma/client';
import { prisma } from '../db';

const router = express.Router();

// Rota acessível por ADMIN e DEV
router.get('/', protect, async (req, res) => {
    try {
        const columns = await prisma.column.findMany({
            orderBy: { order: 'asc' },
            include: {
                tasks: {
                    orderBy: { order: 'asc' },
                },
            },
        });
        res.json(columns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar colunas' });
    }
});

// Rota para criar uma nova coluna (ADMIN)
router.post('/', protect, checkRole([Role.ADMIN]), async (req, res) => {
    try {
        const { title } = req.body;
        const userId = (req as CustomRequest).user!.id;

        if (!title) {
            return res.status(400).json({ message: 'Título da coluna é obrigatório' });
        }

        // Define a ordem da nova coluna como a próxima disponível
        const maxOrderColumn = await prisma.column.findFirst({
            where: { userId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const newOrder = (maxOrderColumn?.order || 0) + 1;

        const column = await prisma.column.create({
            data: {
                title,
                order: newOrder,
                userId,
            },
        });

        res.status(201).json(column);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar coluna' });
    }
});

// Rota para atualizar uma coluna (ADMIN)
router.put('/:id', protect, checkRole([Role.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const userId = (req as CustomRequest).user!.id;

        // Valida se o id foi fornecido
        if (!id) {
            return res.status(400).json({ message: 'ID da coluna é obrigatório' });
        }

        // Busca a coluna garantindo que pertence ao usuário
        const column = await prisma.column.findFirst({
            where: { id, userId },
        });

        if (!column) {
            return res.status(404).json({ message: 'Coluna não encontrada' });
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
router.delete('/:id', protect, checkRole([Role.ADMIN]), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = (req as CustomRequest).user!.id;

        if (!id) {
            return res.status(400).json({ message: 'ID da coluna é obrigatório' });
        }

        const column = await prisma.column.findFirst({
            where: {id, userId  },
        });

        if (!column) {
            return res.status(404).json({ message: 'Coluna não encontrada' });
        }

        await prisma.$transaction(async (prisma) => {
            await prisma.task.deleteMany({
                where: { columnId: id },
            });
        });

        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao deletar coluna' });
    }
});

export default router;
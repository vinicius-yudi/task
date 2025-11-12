import express from 'express';
import { protect, CustomRequest } from '../middleware/auth';
import { prisma } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Rota para obter todos os boards do usuário (incluindo o principal do admin)
router.get('/', protect, async (req, res) => {
    try {
        const userId = (req as CustomRequest).user!.id;
        const isAdmin = (req as CustomRequest).user!.role === 'ADMIN';

        // Boards do usuário (criados por ele)
        const userBoards = await prisma.board.findMany({
            where: { userId },
            select: { id: true, title: true, slug: true, isMainBoard: true, userId: true, createdAt: true, updatedAt: true },
        });

        let boards = [...userBoards];
        let mainBoard = boards.find(b => b.isMainBoard);

        // Lógica de criação do Board Principal do Admin (se for Admin e não tiver)
        if (isAdmin && !mainBoard) {
            const adminEmail = (req as CustomRequest).user!.email;
            const slug = `main-${adminEmail.replace(/[^a-zA-Z0-9]/g, '-')}-${uuidv4()}`;

            const newBoard = await prisma.board.create({
                data: {
                    title: 'Quadro Principal (Admin)',
                    slug: slug,
                    isMainBoard: true,
                    userId: userId,
                },
            });
            await prisma.column.create({ data: { title: 'To Do', order: 1, boardId: newBoard.id } });
            boards.push(newBoard);
            mainBoard = newBoard;
        } 
        
        // Lógica para usuários DEV: Adicionar o board principal do Admin e criar um board pessoal se não tiver.
        if (!isAdmin) {
            const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

            if (adminUser) {
                const adminMainBoard = await prisma.board.findFirst({
                    where: { userId: adminUser.id, isMainBoard: true },
                    select: { id: true, title: true, slug: true, isMainBoard: true, userId: true, createdAt: true, updatedAt: true },
                });
                
                // Adiciona o board principal do admin (se existir) à lista do DEV
                if (adminMainBoard && !boards.some(b => b.id === adminMainBoard.id)) {
                    boards.push(adminMainBoard);
                }
            }
            
            // Cria um board pessoal para o DEV se ele não tiver
            if (!boards.some(b => b.userId === userId && !b.isMainBoard)) {
                 const userEmail = (req as CustomRequest).user!.email;
                 const slug = `pessoal-${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}-${uuidv4()}`;
                 
                 const newBoard = await prisma.board.create({
                    data: {
                        title: `Meu Quadro Pessoal`,
                        slug: slug,
                        isMainBoard: false,
                        userId: userId,
                    },
                 });
                 
                 await prisma.column.create({ data: { title: 'To Do', order: 1, boardId: newBoard.id } });
                 boards.push(newBoard);
            }
        }
        
        // Ordenação: Principal primeiro, depois boards pessoais por título
        boards.sort((a, b) => {
            if (a.isMainBoard && !b.isMainBoard) return -1;
            if (!a.isMainBoard && b.isMainBoard) return 1;
            return a.title.localeCompare(b.title);
        });


        res.json(boards);
    } catch (error) {
        console.error('Erro ao buscar boards:', error);
        res.status(500).json({ message: 'Erro ao buscar boards' });
    }
});

// Rota para criar um novo board (ADMIN ou DEV)
router.post('/', protect, async (req, res) => {
    try {
        const { title } = req.body;
        const userId = (req as CustomRequest).user!.id;

        if (!title) {
            return res.status(400).json({ message: 'Título é obrigatório' });
        }
        
        // Cria um slug único
        const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.board.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter++}`;
        }


        const board = await prisma.board.create({
            data: {
                title,
                slug,
                userId,
                isMainBoard: false, 
            },
        });
        
        // Cria uma coluna padrão "To Do" para o novo board
        await prisma.column.create({
            data: {
                title: 'To Do',
                order: 1,
                boardId: board.id,
            },
        });

        res.status(201).json(board);
    } catch (error) {
        console.error('Erro ao criar board:', error);
        res.status(500).json({ message: 'Erro ao criar board' });
    }
});

export default router;
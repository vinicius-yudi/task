import express from "express";
import { protect, checkRole, CustomRequest } from "../middleware/auth";
import { Role } from "@prisma/client";
import { prisma } from "../db";

const router = express.Router();

// Rota para listar todas as tarefas (de um board específico, opcional)
router.get("/", protect, async (req, res) => {
  try {
    const userId = (req as CustomRequest).user!.id;
    const { columnId } = req.query;

    const where: any = { userId };
    if (typeof columnId === "string") where.columnId = columnId;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        column: { select: { id: true, title: true, order: true } },
      },
    });

    return res.json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar tarefas" });
  }
});

// Rota para obter uma tarefa por ID
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as CustomRequest).user!.id;

    if (!id) {
      return res.status(400).json({ message: "ID da tarefa é obrigatório" });
    }

    // A tarefa deve pertencer ao usuário
    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: {
        column: { select: { id: true, title: true, order: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    return res.json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar tarefa" });
  }
});

// Rota para criar uma nova tarefa (ADMIN)
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, columnId } = req.body;
    const userId = (req as CustomRequest).user!.id;

    if (!title || !columnId) {
      return res
        .status(400)
        .json({ message: "Título e ID da coluna são obrigatórios" });
    }
    
    // Verificar se a coluna pertence a um board DO QUAL o usuário logado é o owner.
    const column = await prisma.column.findFirst({
        where: { id: columnId },
        include: {
            board: {
                select: { userId: true }
            }
        }
    });

    // Somente o owner do board (userId) pode criar tarefas nele (ADMIN)
    if (!column || !column.board || column.board.userId !== userId) {
      return res.status(403).json({ message: 'Acesso negado: Somente o owner do board pode criar tarefas.' });
    }

    // Determina a ordem da nova tarefa
    const maxOrderTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrderTask?.order || 0) + 1;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        columnId,
        userId,
        order: newOrder,
        done: false,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar tarefa" });
  }
});

// Rota para atualizar detalhes da tarefa (título/descrição) (ADMIN)
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = (req as CustomRequest).user!.id;


    if (!id) {
      return res.status(400).json({ message: "ID da tarefa é obrigatório" });
    }

    // Busca a tarefa, verifica propriedade e o owner do Board
    const task = await prisma.task.findFirst({
      where: { id: id, userId },
      select: { column: { select: { board: { select: { userId: true, isMainBoard: true } } } }, id: true, title: true, description: true }
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada ou acesso negado" });
    }

    // Verifica se o usuário logado é o owner do board 
    if (!task.column.board || task.column.board.userId !== userId) {
         return res.status(403).json({ message: "Acesso negado: Apenas o owner do board pode editar tarefas." });
    }


    // Atualiza a tarefa
    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: {
        title: title ?? task.title,
        description: description ?? task.description,
      },
    });

    return res.json(updatedTask);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    return res.status(500).json({ message: "Erro ao atualizar tarefa" });
  }
});

// Rota para mover/reordenar tarefa (ADMIN e DEV)
router.put("/:id/move", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { newColumnId, newOrder } = req.body;
    const userId = (req as CustomRequest).user!.id;

    if (!newColumnId || newOrder === undefined) {
      return res
        .status(400)
        .json({ message: "ID da nova coluna e nova ordem são obrigatórios" });
    }

    if (!id) {
      return res.status(400).json({ message: "ID da tarefa é obrigatório" });
    }

    // Busca a tarefa para verificar propriedade
    const task = await prisma.task.findFirst({
      where: { id, userId },
      select: { id: true, columnId: true, order: true },
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada ou acesso negado" });
    }
    
    // Busca o board da coluna atual para checar a propriedade
    const oldColumnBoard = await prisma.column.findUnique({
        where: { id: task.columnId },
        select: { boardId: true, board: { select: { userId: true, isMainBoard: true } } }
    });

    // Busca o board da nova coluna para checar a propriedade
    const newColumnBoard = await prisma.column.findUnique({
        where: { id: newColumnId },
        select: { boardId: true, board: { select: { userId: true, isMainBoard: true } } }
    });

    if (!oldColumnBoard || !newColumnBoard) {
        return res.status(404).json({ message: "Coluna não encontrada" });
    }

    const isOwnerOfOldBoard = !!oldColumnBoard.board && oldColumnBoard.board.userId === userId;
    const isOwnerOfNewBoard = !!newColumnBoard.board && newColumnBoard.board.userId === userId;
    
    if (!isOwnerOfOldBoard || !isOwnerOfNewBoard) {
        return res.status(403).json({ message: "Acesso negado: Você só pode mover tarefas entre boards que você possui." });
    }
    
    const oldColumnId = task.columnId;
    const oldOrder = task.order;
    const boardId = oldColumnBoard.boardId; 
    const oldBoardIsMain = !!oldColumnBoard.board?.isMainBoard;

    await prisma.$transaction(async (prisma) => {
      // Lógica de reindexação (inalterada)
      if (oldColumnId === newColumnId) {
        if (newOrder < oldOrder) {
            await prisma.task.updateMany({
                where: { columnId: oldColumnId, order: { gte: newOrder, lt: oldOrder } },
                data: { order: { increment: 1 } },
            });
        } else if (newOrder > oldOrder) {
            await prisma.task.updateMany({
                where: { columnId: oldColumnId, order: { gt: oldOrder, lte: newOrder } },
                data: { order: { decrement: 1 } },
            });
        }
      } else {
        await prisma.task.updateMany({
          where: { columnId: oldColumnId, order: { gt: oldOrder } },
          data: { order: { decrement: 1 } },
        });

        await prisma.task.updateMany({
          where: { columnId: newColumnId, order: { gte: newOrder } },
          data: { order: { increment: 1 } },
        });
      }

      await prisma.task.update({
        where: { id },
        data: { columnId: newColumnId, order: newOrder },
      });
    });

    // Após transação, retornar o estado completo das colunas do BOARD ATUAL
    const columns = await prisma.column.findMany({
        where: { boardId },
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            where: oldBoardIsMain ? undefined : { userId },
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

    return res.json(columns);

  } catch (err) {
    console.error("Erro ao mover tarefa:", err);
    return res.status(500).json({ message: "Erro ao mover tarefa" });
  }
});

router.put("/:id/done", protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { done } = req.body;
        const userId = (req as CustomRequest).user!.id;
        
        if (!id || typeof done !== 'boolean') {
            return res.status(400).json({ message: "ID da tarefa e status 'done' são obrigatórios" });
        }
        
        // 1. Verifica se a tarefa pertence ao usuário
        const task = await prisma.task.findFirst({
            where: { id: id, userId },
        });

        if (!task) {
            return res.status(404).json({ message: "Tarefa não encontrada ou acesso negado" });
        }
        
        const updatedTask = await prisma.task.update({
            where: { id: id },
            data: { done },
        });

        return res.json(updatedTask);
    } catch (err) {
        console.error("Erro ao atualizar status da tarefa:", err);
        return res.status(500).json({ message: "Erro ao atualizar status da tarefa" });
    }
});


router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as CustomRequest).user!.id;

    if (!id) {
      return res.status(400).json({ message: "ID da tarefa é obrigatório" });
    }

    // 1. Busca a tarefa para verificar propriedade e o owner do Board
    const task = await prisma.task.findFirst({
        where: { id: id, userId },
        select: { order: true, columnId: true, id: true, column: { select: { board: { select: { userId: true } } } } },
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada ou acesso negado" });
    }
    
    // 2. Verifica se o usuário logado é o owner do Board
    if (!task.column.board || task.column.board.userId !== userId) {
        return res.status(403).json({ message: "Acesso negado: Apenas o owner do board pode deletar tarefas." });
    }


    await prisma.$transaction(async (prisma) => {
      await prisma.task.delete({ where: { id } });
      
      // Reindexa as tarefas restantes na coluna
      await prisma.task.updateMany({
          where: { columnId: task.columnId, order: { gt: task.order } },
          data: { order: { decrement: 1 } },
      });
    });


    return res.json({ id });
    
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    return res.status(500).json({ message: "Erro ao excluir tarefa" });
  }
});

export default router;
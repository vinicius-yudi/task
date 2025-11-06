import express from "express";
import { protect, checkRole, CustomRequest } from "../middleware/auth";
import { Role } from "@prisma/client";
import { prisma } from "../db";

const router = express.Router();

// Rota para listar todas as tarefas
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
router.post("/", protect, checkRole([Role.ADMIN]), async (req, res) => {
  try {
    const { title, description, columnId } = req.body;
    const userId = (req as CustomRequest).user!.id;

    if (!title || !columnId) {
      return res
        .status(400)
        .json({ message: "Título e ID da coluna são obrigatórios" });
    }

    const column = await prisma.column.findFirst({
      where: { id: columnId, userId },
    });

    if (!column) {
      return res.status(404).json({ message: "Coluna não encontrada" });
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

// Rota para atualizar uma tarefa (ADMIN)
router.put("/:id", protect, checkRole([Role.ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = (req as CustomRequest).user!.id;

    if (!id) {
      return res.status(400).json({ message: "ID da tarefa é obrigatório" });
    }

    // Busca a tarefa garantindo que pertence ao usuário
    const task = await prisma.task.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
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
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar tarefa" });
  }
});

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

    const task = await prisma.task.findFirst({
      where: { id, userId },
      select: { id: true, columnId: true, order: true },
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    const oldColumnId = task.columnId;
    const oldOrder = task.order;

    await prisma.$transaction(async (prisma) => {
      if (oldColumnId === newColumnId) {
        if (newOrder < oldOrder) {
          await prisma.task.updateMany({
            where: {
              columnId: oldColumnId,
              order: { gte: newOrder, lt: oldOrder },
            },
            data: { order: { increment: 1 } },
          });
        } else {
          await prisma.task.updateMany({
            where: {
              columnId: oldColumnId,
              order: { gte: newOrder, lt: oldOrder },
            },
            data: { order: { decrement: 1 } },
          });
        }
      } else {
        await prisma.task.updateMany({
          where: {
            columnId: oldColumnId,
            order: { gt: oldOrder },
          },
          data: { order: { decrement: 1 } },
        });

        await prisma.task.updateMany({
          where: {
            columnId: newColumnId,
            order: { gte: newOrder },
          },
          data: { order: { increment: 1 } },
        });
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: { columnId: newColumnId, order: newOrder },
      });
    });

    const columns = await prisma.column.findMany({
        where: { userId },
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
          },
        },
    });

    return res.json(columns);

  } catch (err) {
    console.error("Erro ao mover tarefa:", err);
    return res.status(500).json({ message: "Erro ao mover tarefa" });
  }
});

router.delete("/:id", protect, checkRole([Role.ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as CustomRequest).user!.id;

    if (!id) {
      return res.status(400).json({ message: "ID da tarefa é obrigatório" });
    }

    const task = await prisma.task.findFirst({
        where: { id: id, userId },
        select: { order: true, columnId: true },
    });

    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada" });
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.task.delete({
        where: { id },
      });
    });

    await prisma.task.updateMany({
        where: {
            columnId: task.columnId,
            order: { gt: task.order },
        },
        data: { order: { decrement: 1 } },
    });

    return res.json({ id });
    
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    return res.status(500).json({ message: "Erro ao excluir tarefa" });
  }
});

export default router;

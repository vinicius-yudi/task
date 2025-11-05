import express from "express";
import { protect, checkRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { prisma } from "../db";

const router = express.Router();

// Rota acessível por ADMIN e DEV
router.get("/", protect, async (req, res) => {

    res.json({ message: "Todas as tarefas" });
});

// Rota do ADMIN
router.post("/admin-only", protect, checkRole([Role.ADMIN]), async (req, res) => {

    res.json({ message: "Endpoint de administração executado com sucesso." });
});

// Rota ADMIN e DEV (que é o caso geral de usuário logado)
router.post("/", protect, checkRole([Role.ADMIN, Role.DEV]), async (req, res) => {
    
    res.json({ message: "Tarefa criada." });
});

export default router;
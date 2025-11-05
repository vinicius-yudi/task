import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { protect, CustomRequest } from "../middleware/auth";
import { Role } from "@prisma/client";

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Usuário já existe" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Verifica se é o email do admin definido no .env
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = email.toLowerCase() === adminEmail?.toLowerCase();
    
    console.log('Email registrado:', email);
    console.log('Email admin no .env:', adminEmail);
    console.log('É admin?', isAdmin);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: isAdmin ? Role.ADMIN : Role.DEV,
      },
    });

    console.log('Usuário criado com role:', user.role);

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    return res.status(500).json({ message: "Erro ao registrar usuário" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha são obrigatórios" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true, role: true },
    });

    if (!user) {
      return res.status(400).json({ message: "Credenciais inválidas" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Credenciais inválidas" });
    }

    const token = generateToken(user.id);
    res.cookie("token", token, cookieOptions);


    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ message: "Erro ao realizar login" });
  }
});

// Me
router.get("/me", protect, async (req, res) => {
  const user = (req as CustomRequest).user;
  return res.json(user);
});

// Logout
router.post("/logout", async (_req, res) => {
  res.clearCookie("token", cookieOptions);
  return res.json({ message: "Deslogado com sucesso" });
});

export default router;

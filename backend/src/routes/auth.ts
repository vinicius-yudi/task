import express from "express";
import { prisma } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/auth";

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

//Register route
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios" });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Usuário já existe" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = generateToken(user.id);

  res.cookie("token", token, cookieOptions);

  res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

//Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ message: "Credenciais inválidas" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Credenciais inválidas" });
  }

  const token = generateToken(user.id);

  res.cookie("token", token, cookieOptions);

  res.json({ id: user.id, name: user.name, email: user.email });
});

//Me route
router.get("/me", protect, async (req, res) => {
  res.json({ user: (req as any).user });
});

//Logout route
router.post("/logout", async (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Deslogado com sucesso" });
});

export default router;

import express from "express";
import { prisma } from "./db";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth";


dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

// Health check route
app.get("/health", (_req, res) => res.send("ok"));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Backend up on http://localhost:${PORT}`);
});

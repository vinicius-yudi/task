import express from "express";
import cors from "cors";
import { tasks, createTask, toggleTask, deleteTask } from "./db";
import { Task } from "./types";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * GET /tasks -> 200 Task[]
 */
app.get("/tasks", (_req, res) => {
  res.status(200).json(tasks);
});

/**
 * POST /tasks { title: string } -> 201 Task
 */
app.post("/tasks", (req, res) => {
  const { title } = req.body ?? {};
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "Field 'title' is required." });
  }
  const created: Task = createTask(title.trim());
  res.status(201).json(created);
});

/**
 * PUT /tasks/:id/toggle -> 200 Task | 404
 */
app.put("/tasks/:id/toggle", (req, res) => {
  const { id } = req.params;
  const updated = toggleTask(id);
  if (!updated) return res.status(404).json({ error: "Task not found." });
  res.status(200).json(updated);
});

/**
 * DELETE /tasks/:id -> 204 | 404
 */
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const ok = deleteTask(id);
  if (!ok) return res.status(404).json({ error: "Task not found." });
  res.status(204).send();
});

// healthcheck opcional
app.get("/health", (_req, res) => res.send("ok"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend up on http://localhost:${PORT}`);
});

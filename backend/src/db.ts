import { Task } from "./types";
import { v4 as uuid } from "uuid";

export const tasks: Task[] = [
  { id: "1", title: "Configurar ambiente", createdAt: "2025-10-22T10:00:00Z", done: false },
  { id: "2", title: "Escrever README curto", createdAt: "2025-10-22T10:05:00Z", done: true }
];

// helpers
export function createTask(title: string): Task {
  const t: Task = {
    id: uuid(),
    title,
    createdAt: new Date().toISOString(),
    done: false
  };
  tasks.push(t);
  return t;
}

export function toggleTask(id: string): Task | null {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  const task = tasks[idx];
  if (task) {
    task.done = !task.done;
  }
  return task ? task : null;
}

export function deleteTask(id: string): boolean {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  return true;
}

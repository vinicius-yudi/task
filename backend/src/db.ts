import { Task } from "./types";
import { v4 as uuid } from "uuid";

export const tasks: Task[] = [
];

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

import type { Task } from "./types";

const base = import.meta.env.VITE_API_URL;

export async function listTasks(): Promise<Task[]> {
  const res = await fetch(`${base}/tasks`);
  if (!res.ok) throw new Error("Erro ao carregar tarefas");
  return res.json();
}

export async function createTask(title: string): Promise<Task> {
  const res = await fetch(`${base}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Erro ao criar tarefa");
  }
  return res.json();
}

export async function toggleTask(id: string): Promise<Task> {
  const res = await fetch(`${base}/tasks/${id}/toggle`, { method: "PUT" });
  if (!res.ok) throw new Error("Erro ao alternar tarefa");
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${base}/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao deletar tarefa");
}

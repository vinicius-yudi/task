import { useEffect, useState } from "react";
import type { Task } from "./types";
import { listTasks, createTask, toggleTask, deleteTask } from "./api";
import "./index.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  Settings,
  CheckSquare,
  HelpCircle,
  LogOut,
} from "lucide-react";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const data = await listTasks();
      setTasks(data);
    } catch (e: any) {
      setError(e.message ?? "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      const created = await createTask(title.trim());
      setTasks((prev) => [created, ...prev]);
      setTitle("");
    } catch (e: any) {
      setError(e.message ?? "Erro ao criar");
    } finally {
      setSubmitting(false);
    }
  }

  async function onToggle(id: string) {
    try {
      const updated = await toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e: any) {
      setError(e.message ?? "Erro ao alternar");
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e: any) {
      setError(e.message ?? "Erro ao deletar");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6 space-y-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Task Manager</h2>
        </div>

        <nav className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-white "
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Dashboard
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-white "
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Tasks
          </Button>
          
        </nav>

        <div className="absolute bottom-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-white "
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-8">
        <form onSubmit={onSubmit} className="mb-4">
          <input
            className="border p-2 rounded mr-2"
            placeholder="Título da tarefa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            required
          />
          <Button type="submit" disabled={submitting || !title.trim()}>
            {submitting ? "Adicionando" : "Adicionar"}
          </Button>
        </form>

        {loading && <p className="text-gray-500">Carregando...</p>}
        {error && <p className="text-red-500">⚠️ {error}</p>}

        <ul className="list">
          {tasks.map((t) => (
            <li
              key={t.id}
              className={`item ${t.done ? "done" : ""} border-b py-2`}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => onToggle(t.id)}
                  className="mr-2"
                />
                <div className="content">
                  <span className="title">{t.title}</span>
                  <span className="meta text-gray-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                className="bg-red-500 text-white p-1 rounded"
                onClick={() => onDelete(t.id)}
              >
                Deletar
              </button>
            </li>
          ))}
        </ul>

        {!loading && tasks.length === 0 && (
          <p className="text-gray-500">Sem tarefas por enquanto.</p>
        )}
      </div>
    </div>
  );
}

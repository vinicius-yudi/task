import { useEffect, useState } from "react";
import type { Task } from "./types";
import { listTasks, createTask, toggleTask, deleteTask } from "./api";
import "./index.css";

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
      setTasks(prev => [created, ...prev]);
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
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (e: any) {
      setError(e.message ?? "Erro ao alternar");
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      setError(e.message ?? "Erro ao deletar");
    }
  }

  return (
    <div className="container">
      <h1>Mini Task Manager</h1>

      <form onSubmit={onSubmit} className="form">
        <input
          placeholder="Título da tarefa..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          required
        />
        <button type="submit" disabled={submitting || !title.trim()}>
          {submitting ? "Adicionando..." : "Adicionar"}
        </button>
      </form>

      {loading && <p className="info">Carregando...</p>}
      {error && <p className="error">⚠️ {error}</p>}

      <ul className="list">
        {tasks.map((t) => (
          <li key={t.id} className={`item ${t.done ? "done" : ""}`}>
            <div className="left">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => onToggle(t.id)}
              />
              <div className="content">
                <span className="title">{t.title}</span>
                <span className="meta">
                  {new Date(t.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <button className="delete" onClick={() => onDelete(t.id)}>
              Deletar
            </button>
          </li>
        ))}
      </ul>

      {!loading && tasks.length === 0 && (
        <p className="info">Sem tarefas por enquanto.</p>
      )}
    </div>
  );
}

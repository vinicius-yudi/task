import { useEffect, useState } from "react";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import {LogOut } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { CheckSquare, LayoutGrid } from "lucide-react";

export function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  

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
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-8 bg-slate-700">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Tarefas</h1>

          <form  className="mb-8 flex gap-2">
            <input
              className="flex-1 bg-slate-900 text-white border-slate-800 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tarefa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              required
            />
            <Button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-6 pw-3"
            >
              {submitting ? "" : "Criar"}
            </Button>
          </form>

          {loading && (
            <div className="flex justify-center py-8">
              <p className="text-slate-400">Carregando as tarefas...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-500">⚠️ {error}</p>
            </div>
          )}

          <ul className="space-y-3">
            {tasks.map((t) => (
              <li
                key={t.id}
                className={`bg-slate-900 rounded-lg p-4 border border-slate-800 transition-opacity ${
                  t.done ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => (t.id)}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-800 checked:bg-blue-500"
                    />
                    <div className="flex-1">
                      <p
                        className={`text-white text-lg ${
                          t.done ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {t.title}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Criado em {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => (t.id)}
                  >
                    Deletar
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {!loading && tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhuma tarefa criada no momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import type { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { LogOut, CheckSquare, LayoutGrid } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from "@/components/mode-toggle";

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
      <div className="relative w-64 border-r bg-white text-slate-900 p-6 space-y-4 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Task Manager</h2>
          <ModeToggle />
        </div>

        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Dashboard
          </Button>

          <Button variant="ghost" className="w-full justify-start">
            <CheckSquare className="mr-2 h-4 w-4" />
            Tasks
          </Button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

    
          {!loading && tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                Nenhuma tarefa criada no momento
              </p>
            </div>
          )}
        </div>
  );
}
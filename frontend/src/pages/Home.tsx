import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";
import { BoardColumn } from "@/components/BoardColumn";
import { toast } from "react-toastify";
import {
  DndContext,
  type DragStartEvent,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/TaskCard";

interface Task {
  id: string;
  title: string;
  description?: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export function Home() {
  const { logout, isAdmin, user } = useAuth();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [columns, setColumns] = useState<Column[]>([
    {
      id: "backlog",
      title: "BACKLOG",
      tasks: [
        { id: "1", title: "Login Page", description: "Criar página de login" },
        { id: "2", title: "Register Page" },
      ],
    },
    {
      id: "todo",
      title: "A FAZER",
      tasks: [
        { id: "3", title: "CRUD Tarefas", description: "Implementar operações CRUD" },
      ],
    },

  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeColumn = columns.find((col) =>
      col.tasks.some((t) => t.id === activeId)
    );
    const overColumn = columns.find(
      (col) => col.id === overId || col.tasks.some((t) => t.id === overId)
    );

    if (!activeColumn || !overColumn) return;

    setColumns((prev) => {
      const activeIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
      const activeTask = activeColumn.tasks[activeIndex];

      if (activeColumn.id === overColumn.id) {
        const overIndex = overColumn.tasks.findIndex((t) => t.id === overId);
        return prev.map((col) => {
          if (col.id === activeColumn.id) {
            return {
              ...col,
              tasks: arrayMove(col.tasks, activeIndex, overIndex),
            };
          }
          return col;
        });
      } else {
        return prev.map((col) => {
          if (col.id === activeColumn.id) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== activeId),
            };
          }
          if (col.id === overColumn.id) {
            const overIndex = col.tasks.findIndex((t) => t.id === overId);
            const newTasks = [...col.tasks];
            newTasks.splice(
              overIndex >= 0 ? overIndex : col.tasks.length,
              0,
              activeTask
            );
            return { ...col, tasks: newTasks };
          }
          return col;
        });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
  };

  const handleAddTask = (columnId: string) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar tarefas');
      return;
    }

    const newTask = {
      id: `task-${Date.now()}`,
      title: "Nova tarefa",
      description: "Clique para editar",
    };

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, newTask] }
          : col
      )
    );

    toast.success('Tarefa criada com sucesso!');
  };

  const handleAddColumn = () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar colunas');
      return;
    }

    const newColumn = {
      id: `col-${Date.now()}`,
      title: "NOVA COLUNA",
      tasks: [],
    };
    setColumns([...columns, newColumn]);
    toast.success('Coluna criada com sucesso!');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background p-6 flex flex-col">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Task Manager</h2>
          <ModeToggle />
        </div>

        {/* Info do usuário */}
        <div className="mb-4 p-3 rounded-lg bg-muted">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <span
            className={`inline-block mt-2 px-2 py-1 text-xs rounded font-semibold ${
              isAdmin
                ? "bg-purple-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            {user?.role}
          </span>
        </div>

        <div className="flex-1" />

        <Button variant="ghost" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto bg-background/50 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Quadro de Tarefas</h1>
          {isAdmin && (
            <Button onClick={handleAddColumn}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Coluna
            </Button>
          )}
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 pb-4">
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                onAddTask={handleAddTask}
                canAddTask={isAdmin}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

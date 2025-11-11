import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/Mode-toggle";
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
import type { Column, Task } from "@/types";
import axios from "axios";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { EditColumnDialog } from "@/components/EditColumnDialog";

const API_URL = import.meta.env.VITE_API_URL;

export function Home() {
  const { logout, isAdmin, user } = useAuth();
  const [columns, setColumns] = useState<Column[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchColumns = async () => {
    setIsFetching(true);
    try {
      const response = await axios.get<Column[]>(`${API_URL}/columns`);
      setColumns(response.data);
    } catch (error) {
      console.error("Erro ao carregar colunas:", error);
      toast.error("Erro ao carregar colunas.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchColumns();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findColumnIdByTaskId = (taskId: string) => {
    return columns.find((col) => col.tasks.some((t) => t.id === taskId))?.id;
  };

  const findTaskById = (taskId: string) => {
    return columns.flatMap((col) => col.tasks).find((t) => t.id === taskId);
  };

  //Funções de DND
  const handleDragStart = (event: DragStartEvent) => {
    const task = findTaskById(event.active.id as string);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;
    if (!activeTask) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnId = findColumnIdByTaskId(activeId);
    const overColumnId =
      findColumnIdByTaskId(overId) ||
      (over.data.current?.sortable?.containerId as string) ||
      overId;

    if (!activeColumnId || !overColumnId) return;

    // A tarefa não se moveu, ignora.
    if (activeId === overId && activeColumnId === overColumnId) return;

    const oldColumn = columns.find((col) => col.id === activeColumnId);
    const newColumn = columns.find((col) => col.id === overColumnId);
    if (!oldColumn || !newColumn) return;

    //Calcular a nova ordem/posição
    const activeIndex = oldColumn.tasks.findIndex((t) => t.id === activeId);
    let overIndex = newColumn.tasks.findIndex((t) => t.id === overId);

    // Se arrastou sobre a própria coluna (e não sobre uma tarefa) ou a coluna está vazia
    if (overIndex === -1) {
      // Se a coluna de destino está vazia, insere no final (index 0)
      overIndex = newColumn.tasks.length;
    }

    const newOrder = overIndex;
    const newColumnId = overColumnId;

    //Otimisticamente atualizar o estado
    setColumns((prev) => {
      const newCols = prev.map((col) => {
        if (col.id === activeColumnId) {
          //Remove da coluna antiga
          return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
        }
        return col;
      });

      const targetCol = newCols.find((col) => col.id === newColumnId);
      if (targetCol) {
        //Insere na nova coluna/posição
        const newTasks = [...targetCol.tasks];
        const updatedActiveTask = {
          ...activeTask,
          columnId: newColumnId,
          order: newOrder,
        };

        // Se a coluna de destino é a mesma e só está reordenando
        if (activeColumnId === newColumnId) {
          const tempTasks = arrayMove(
            oldColumn.tasks,
            activeIndex,
            newOrder
          ).filter((t) => t.id !== activeId);
          tempTasks.splice(newOrder, 0, updatedActiveTask as Task);
          return newCols.map((col) =>
            col.id === newColumnId ? { ...col, tasks: tempTasks } : col
          );
        } else {
          // Movendo para outra coluna
          newTasks.splice(newOrder, 0, updatedActiveTask as Task);
          return newCols.map((col) =>
            col.id === newColumnId ? { ...col, tasks: newTasks } : col
          );
        }
      }
      return newCols;
    });

    //Chamar API para persistir
    try {
      // O backend cuidará do reindexamento e retornará o estado atualizado
      const response = await axios.put(`${API_URL}/tasks/${activeId}/move`, {
        newColumnId,
        newOrder,
      });
      // Substituir o estado local com a resposta do backend (colunas atualizadas)
      setColumns(response.data);
      toast.success("Tarefa movida com sucesso!");
    } catch (error) {
      console.error("Erro ao persistir movimento:", error);
      toast.error("Erro ao mover tarefa. Recarregue a página.");
      // Se a persistência falhar, re-fetch para reverter ao estado real
      fetchColumns();
    }
  };

  //Funções de CRUD de Tarefas
  const handleOpenTaskDialog = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleCreateTask = async (columnId: string) => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem criar tarefas");
      return;
    }
    try {
      const response = await axios.post<Task>(`${API_URL}/tasks`, {
        title: "Nova Tarefa",
        description: "Clique para editar",
        columnId: columnId,
      });

      const newTask = response.data;

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
        )
      );
      toast.success("Tarefa criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast.error("Falha ao criar tarefa.");
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    title: string,
    description: string
  ) => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const response = await axios.put<Task>(`${API_URL}/tasks/${taskId}`, {
        title,
        description,
      });

      const updatedTask = response.data;

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        }))
      );
      toast.success("Tarefa atualizada!");
      setIsTaskDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Falha ao atualizar tarefa.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!isAdmin) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`);

      // Simplesmente remove a tarefa do estado e re-fetch para reindexação (mais seguro)
      // Ou remove otimisticamente
      setColumns((prev) => {
        return prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        }));
      });

      toast.success("Tarefa excluída!");
      setIsTaskDialogOpen(false);
      fetchColumns();
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
      toast.error("Falha ao deletar tarefa.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleTaskDone = async (taskId: string, done: boolean) => {
    try {
      const response = await axios.put<Task>(
        `${API_URL}/tasks/${taskId}/done`,
        { done }
      );
      const updatedTask = response.data;

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
        }))
      );

      toast.success(`Tarefa marcada como ${done ? "Concluída" : "Pendente"}!`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Falha ao atualizar status da tarefa.");
    }
  };

  //Funções de CRUD de Colunas
  const handleOpenColumnEdit = (column: Column) => {
    if (!isAdmin) return;
    setSelectedColumn(column);
    setIsColumnDialogOpen(true);
  };

  const handleUpdateColumn = async (columnId: string, newTitle: string) => {
    if (!isAdmin || !selectedColumn) return;
    setIsSaving(true);
    try {
      const response = await axios.put<Column>(
        `${API_URL}/columns/${columnId}`,
        {
          title: newTitle,
        }
      );

      const updatedColumn = response.data;

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...updatedColumn, tasks: col.tasks } : col
        )
      );

      toast.success("Coluna atualizada!");
      setIsColumnDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar coluna:", error);
      toast.error("Falha ao atualizar coluna.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!isAdmin) return;
    if (
      !window.confirm(
        "ATENÇÃO: Excluir esta coluna também EXCLUIRÁ TODAS as tarefas contidas nela. Continuar?"
      )
    )
      return;

    try {
      await axios.delete(`${API_URL}/columns/${columnId}`);

      setColumns((prev) => prev.filter((col) => col.id !== columnId));

      toast.success("Coluna excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao deletar coluna:", error);
      toast.error("Falha ao deletar coluna.");
    }
  };

  const handleAddColumn = async () => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem criar colunas");
      return;
    }

    try {
      const response = await axios.post<Column>(`${API_URL}/columns`, {
        title: "NOVA COLUNA",
      });

      setColumns([...columns, { ...response.data, tasks: [] }]);
      toast.success("Coluna criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar coluna:", error);
      toast.error("Falha ao criar coluna.");
    }
  };

  if (isFetching) {
    //
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background p-6 flex flex-col">
        {/* ... (código do cabeçalho da sidebar) ... */}
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
              isAdmin ? "bg-purple-500 text-white" : "bg-blue-500 text-white"
            }`}
          >
            {user?.role}
          </span>
        </div>

        <div className="flex-1" />

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={logout}
        >
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
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 pb-4 h-full">
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                onAddTask={handleCreateTask}
                onTaskClick={handleOpenTaskDialog}
                onToggleTaskDone={handleToggleTaskDone}
                onEditColumn={handleOpenColumnEdit}
                onDeleteColumn={handleDeleteColumn}
                canManageColumns={isAdmin}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onClick={() => {}}
                onToggleDone={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          isOpen={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
          isSaving={isSaving}
          isDeleting={isDeleting}
          isAdmin={isAdmin}
        />
      )}

      {selectedColumn && isAdmin && (
        <EditColumnDialog
          column={selectedColumn}
          isOpen={isColumnDialogOpen}
          onOpenChange={setIsColumnDialogOpen}
          onSave={handleUpdateColumn}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

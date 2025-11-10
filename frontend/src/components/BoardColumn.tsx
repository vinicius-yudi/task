import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil } from "lucide-react"; 
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import type { Column, Task } from "@/types";

interface BoardColumnProps {
  column: Column; 
  onAddTask: (columnId: string) => void;
  onTaskClick: (task: Task) => void; 
  onToggleTaskDone: (taskId: string, done: boolean) => void; 
  onEditColumn: (column: Column) => void; 
  onDeleteColumn: (columnId: string) => void; 
  canManageColumns: boolean;
}

export function BoardColumn({
  column,
  onAddTask,
  onTaskClick,
  onToggleTaskDone,
  onEditColumn,
  onDeleteColumn,
  canManageColumns,
}: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <Card className="w-80 flex-shrink-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center">
            {column.title}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {column.tasks.length}
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            {canManageColumns && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Editar Coluna"
                  onClick={() => onEditColumn(column)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive" // Usar variante destrutiva para exclusão
                  size="icon-sm"
                  title="Excluir Coluna"
                  onClick={() => onDeleteColumn(column.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Adicionar Tarefa"
                  onClick={() => onAddTask(column.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            )}
            {!canManageColumns && (
              <span className="ml-2 text-xs text-muted-foreground">
                Visualização
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent ref={setNodeRef} className="space-y-2 min-h-[200px]">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={onTaskClick}
              onToggleDone={onToggleTaskDone}
            />
          ))}
        </SortableContext>
        {column.tasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma tarefa
          </p>
        )}
      </CardContent>
    </Card>
  );
}
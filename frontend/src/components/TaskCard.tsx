import { Card, CardContent } from "@/components/ui/card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle } from "lucide-react";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onToggleDone: (taskId: string, done: boolean) => void;
}

export function TaskCard({ task, onClick, onToggleDone }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={
          "mb-2 cursor-pointer hover:shadow-md transition-shadow " +
          (task.done
            ? "border-green-500 bg-green-50/50 dark:bg-green-900/50"
            : "")
        }
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              className="cursor-grab active:cursor-grabbing mt-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1" onClick={() => onClick(task)}>
              <h4
                className={`font-medium text-sm ${
                  task.done ? "line-through text-muted-foreground" : ""
                }`}
              >
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {task.description}
                </p>
              )}
            </div>
            {/* Botão de Status para DEV/ADMIN */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleDone(task.id, !task.done);
              }}
              title={
                task.done ? "Tarefa Desmarcada" : "Marcar como Concluída"
              }
              className="shrink-0 transition-colors mt-1"
            >
              <CheckCircle
                className={`h-5 w-5 ${
                  task.done
                    ? "text-green-600"
                    : "text-muted-foreground/50 hover:text-green-600"
                }`}
                fill={task.done ? "currentColor" : "none"}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

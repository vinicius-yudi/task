import type { Task } from "@/types";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";


interface EditTaskDialogProps {
    task: Task;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (taskId: string, title: string, description: string) => void;
    onDelete: (taskId: string) => void;
    isSaving: boolean;
    isDeleting: boolean;
    isAdmin: boolean;
}

export function EditTaskDialog({
    task,
    isOpen,
    onOpenChange,
    onSave,
    onDelete,
    isSaving,
    isDeleting,
    isAdmin,
}: EditTaskDialogProps) {
    const [title, setTitle] = React.useState(task.title);
    const [description, setDescription] = React.useState(task.description || "");

    React.useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || "");
    }, [task]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(task.id, title, description);
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            onDelete(task.id);
        }
    };

    return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isAdmin ? "Editar Tarefa" : "Visualizar Tarefa"}
            {isAdmin && (
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Faça as alterações na tarefa e clique em salvar."
              : "Detalhes da tarefa. Somente administradores podem editar."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isAdmin}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              rows={4}
              className="flex h-auto w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Fechar
              </Button>
            </DialogClose>
            {isAdmin && (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
    
    

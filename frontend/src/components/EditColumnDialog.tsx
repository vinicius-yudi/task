import type { Column } from "@/types";
import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface EditTaskDialogProps {
  column: Column | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (columnId: string, title: string) => void;
  isSaving: boolean;
}

export function EditColumnDialog({
  column,
  isOpen,
  onOpenChange,
  onSave,
  isSaving,
}: EditTaskDialogProps) {
  const [title, setTitle] = React.useState(column ? column.title : "");

  React.useEffect(() => {
    setTitle(column?.title || "");
  }, [column]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (column) {
      onSave(column.id, title);
    }
  };

  if (!column) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Coluna: {column.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Novo Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || title === column.title}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

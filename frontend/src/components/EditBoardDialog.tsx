import type { Board } from "@/types";
import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface EditBoardDialogProps {
  board: Board;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (boardId: string, title: string) => void;
  isSaving: boolean;
}

export function EditBoardDialog({
  board,
  isOpen,
  onOpenChange,
  onSave,
  isSaving,
}: EditBoardDialogProps) {
  const [title, setTitle] = React.useState(board.title);

  React.useEffect(() => {
    // Atualiza o estado interno se a prop do board mudar
    setTitle(board.title);
  }, [board]);
  
  // Verifica se o título é válido e se foi realmente alterado
  const isTitleValid = title.trim() !== "" && title !== board.title;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTitleValid) {
      onSave(board.id, title);
    }
  };

  // Prevenção de segurança no front-end para não abrir a modal para o board principal
  if (board.isMainBoard) return null; 

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Board: {board.title}</DialogTitle>
          <DialogDescription>Altere o título do seu quadro pessoal.</DialogDescription>
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
            <Button type="submit" disabled={isSaving || !isTitleValid}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
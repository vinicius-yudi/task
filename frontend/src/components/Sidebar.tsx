import {
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Pencil,
  Trash2,
  Type,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/Mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TypeUser } from "@/components/TypeUser";
import type { Board } from "@/types";

interface SidebarProps {
  boards: Board[];
  currentBoard: Board | null;
  onSelectBoard: (board: Board) => void;
  onCreateBoard: () => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
}

export function Sidebar({
  boards,
  currentBoard,
  onSelectBoard,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
}: SidebarProps) {
  const { logout, isAdmin, user } = useAuth();

  return (
    <div className="w-80 border-r bg-background p-6 flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Manager</h2>
        <ModeToggle />
      </div>

      <Separator className="mb-4" />

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Boards</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Criar Novo Board"
          onClick={onCreateBoard}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {boards.map((board) => {
          const isSelected = board.id === currentBoard?.id;
          const isOwner = board.userId === user?.id;

          const isActionDisabled = board.isMainBoard && !isAdmin;

          return (
            <div key={board.id} className="group/board-item relative">
              <Button
                variant={isSelected ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 pr-10"
                onClick={() => onSelectBoard(board)}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">{board.title}</span>
                {board.isMainBoard && (
                  <span className="text-xs text-muted-foreground shrink-0">
                  </span>
                )}
              </Button>

              {isOwner && (
                <div
                  className={
                    "absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 transition-opacity " +
                    (isSelected
                      ? "opacity-100"
                      : "opacity-0 group-hover/board-item:opacity-100")
                  }
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Editar Board"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBoard(board);
                    }}
                    disabled={isActionDisabled}
                    className="p-0 size-6"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    title="Excluir Board"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBoard(board.id);
                    }}
                    disabled={isActionDisabled}
                    className="p-0 size-6"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TypeUser />
      <Separator />

      <Button
        variant="ghost"
        className="w-full justify-start mt-6"
        onClick={logout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}

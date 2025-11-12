// frontend/src/components/Sidebar.tsx (Versão atualizada)
import { LogOut, LayoutDashboard, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ModeToggle } from "@/components/Mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Board } from "@/types";

interface SidebarProps {
  boards: Board[];
  currentBoard: Board | null;
  onSelectBoard: (board: Board) => void;
  onCreateBoard: () => void; 
  onEditBoard: () => void;   
  onDeleteBoard: (boardId: string) => void; 
  canManageBoard: boolean; 
}

export function Sidebar({ boards, currentBoard, onSelectBoard, onCreateBoard, onEditBoard, onDeleteBoard, canManageBoard }: SidebarProps) {
  const { logout, isAdmin, user } = useAuth();
  
  const isMainBoard = currentBoard?.isMainBoard;

  const shouldDisableMainBoardAction = isMainBoard && !isAdmin;

  return (
    <div className="w-64 border-r bg-background p-6 flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Manager</h2>
        <ModeToggle />
      </div>

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
      
      <Separator className="mb-4" />

      {currentBoard && canManageBoard && (
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold truncate" title={currentBoard.title}>Board Atual</h3>
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Editar Board"
                    onClick={onEditBoard}
                    // Desabilita se for o board principal
                    disabled={shouldDisableMainBoardAction} 
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="destructive"
                    size="icon-sm"
                    title="Excluir Board"
                    onClick={() => onDeleteBoard(currentBoard.id)}
                    // Desabilita se for o board principal
                    disabled={shouldDisableMainBoardAction} 
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
      )}
      
      {/* Lista de Boards com botão para criar novo (Novo) */}
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
        {boards.map((board) => (
          <Button
            key={board.id}
            variant={board.id === currentBoard?.id ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => onSelectBoard(board)}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="truncate flex-1 text-left">{board.title}</span>
            {board.isMainBoard && <span className="text-xs text-muted-foreground"> (Admin)</span>}
          </Button>
        ))}
      </div>

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
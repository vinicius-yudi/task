import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import type { Board as BoardType } from "@/types";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar"; 
import { Board } from "@/components/Board";     
import { EditBoardDialog } from "@/components/EditBoardDialog";

const API_URL = import.meta.env.VITE_API_URL;

export function Home() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [currentBoard, setCurrentBoard] = useState<BoardType | null>(null);
  const [isFetchingBoards, setIsFetchingBoards] = useState(true);
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  const [isSavingBoard, setIsSavingBoard] = useState(false); 
  const [boardToEdit, setBoardToEdit] = useState<BoardType | null>(null); 
  
  const fetchBoards = async () => {
    setIsFetchingBoards(true);
    try {
        const response = await axios.get<BoardType[]>(`${API_URL}/boards`);
        const fetchedBoards = response.data;
        setBoards(fetchedBoards);
        
        if (!currentBoard && fetchedBoards.length > 0) {
          setCurrentBoard(fetchedBoards[0]);
        }
        else if (currentBoard) {
            const updatedCurrent = fetchedBoards.find(b => b.id === currentBoard.id);
            if (updatedCurrent) setCurrentBoard(updatedCurrent);
        }
        
        return fetchedBoards;
      } catch (error) {
        console.error("Erro ao carregar boards:", error);
        toast.error("Erro ao carregar boards.");
        return [];
      } finally {
          setIsFetchingBoards(false);
      }
  };


  useEffect(() => {
    fetchBoards();
  }, []);

  // Recarrega as colunas sempre que o board mudar
  useEffect(() => {
    if (currentBoard && currentBoard.id) {
    }
  }, [currentBoard]); 
  
  const handleSelectBoard = (board: BoardType) => {
    setCurrentBoard(board);
  };
  
  const handleCreateBoard = async () => {
    const title = window.prompt("Digite o título do novo board:");
    if (!title || title.trim() === "") return;

    try {
      const response = await axios.post<BoardType>(`${API_URL}/boards`, { title });
      const newBoard = response.data;
      
      setBoards(prev => {
          const updatedBoards = [...prev, newBoard];
          updatedBoards.sort((a, b) => {
              if (a.isMainBoard && !b.isMainBoard) return -1;
              if (!a.isMainBoard && b.isMainBoard) return 1;
              return a.title.localeCompare(b.title);
          });
          return updatedBoards;
      });
      setCurrentBoard(newBoard);
      toast.success(`Board '${newBoard.title}' criado com sucesso!`);
    } catch (error) {
      console.error("Erro ao criar board:", error);
      toast.error("Falha ao criar board.");
    }
  };

  const handleOpenBoardEdit = (board: BoardType) => {
    if (board.isMainBoard && user?.role !== 'ADMIN') return;
    
    setBoardToEdit(board); 
    setIsBoardDialogOpen(true);
  };

  const handleUpdateBoard = async (boardId: string, newTitle: string) => {
    if (!boardToEdit || boardToEdit.isMainBoard && user?.role !== 'ADMIN') return;
    setIsSavingBoard(true);
    try {
        const response = await axios.put<BoardType>(`${API_URL}/boards/${boardId}`, { title: newTitle });
        const updatedBoard = response.data;

        setBoards(prev => prev.map(b => b.id === boardId ? updatedBoard : b));
        if (currentBoard?.id === boardId) {
            setCurrentBoard(updatedBoard);
        }
        
        toast.success("Board atualizado com sucesso!");
        setIsBoardDialogOpen(false);
        setBoardToEdit(null);
    } catch (error) {
        console.error("Erro ao atualizar board:", error);
        toast.error("Falha ao atualizar board."); 
    } finally {
        setIsSavingBoard(false);
    }
  };
  
  const handleDeleteBoard = async (boardId: string) => {
    const boardToDelete = boards.find(b => b.id === boardId);
    
    if (!boardToDelete || boardToDelete.isMainBoard && user?.role !== 'ADMIN') {
        toast.error("Não é possível excluir este quadro.");
        return;
    }
    
    if (!window.confirm(`ATENÇÃO: Excluir o board '${boardToDelete.title}' EXCLUIRÁ TODAS as colunas e tarefas nele. Continuar?`)) {
        return;
    }

    try {
      await axios.delete(`${API_URL}/boards/${boardId}`);
      toast.success("Board excluído com sucesso.");

      const newBoards = boards.filter(b => b.id !== boardId);
      setBoards(newBoards);
      
      // Se o board excluído for o atual, selecione o primeiro restante
      if (currentBoard?.id === boardId) {
          setCurrentBoard(newBoards.length > 0 ? newBoards[0] : null);
      }

    } catch (error) {
      console.error("Erro ao deletar board:", error);
      toast.error("Falha ao deletar board.");
    }
  };
  
  if (isFetchingBoards && !currentBoard) {
    return <div className="p-6">Carregando boards...</div>;
  }
  
  if (!currentBoard) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-xl">Nenhum board encontrado. Crie um novo board.</p>
        </div>
    );
  }

  const canManageBoard = currentBoard.userId === user?.id;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        boards={boards}
        currentBoard={currentBoard}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={handleCreateBoard} 
        onEditBoard={handleOpenBoardEdit} 
        onDeleteBoard={handleDeleteBoard} 
      />

      <Board 
        currentBoard={currentBoard}
        isAdmin={user?.role === 'ADMIN'}
        canManageBoard={canManageBoard}
      />
      
      {boardToEdit && (
        <EditBoardDialog
          board={boardToEdit}
          isOpen={isBoardDialogOpen}
          onOpenChange={(open) => {
            setIsBoardDialogOpen(open);
            if (!open) setBoardToEdit(null);
          }}
          onSave={handleUpdateBoard}
          isSaving={isSavingBoard}
        />
      )}
    </div>
  );
}
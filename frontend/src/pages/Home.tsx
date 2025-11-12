// frontend/src/pages/Home.tsx (Versão atualizada)
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import type { Board as BoardType } from "@/types";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar"; 
import { Board } from "@/components/Board";     
import { EditBoardDialog } from "@/components/EditBoardDialog"; // NOVO IMPORT

const API_URL = import.meta.env.VITE_API_URL;

export function Home() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [currentBoard, setCurrentBoard] = useState<BoardType | null>(null);
  const [isFetchingBoards, setIsFetchingBoards] = useState(true);
  
  // Estados para o diálogo de edição do Board
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  const [isSavingBoard, setIsSavingBoard] = useState(false); 

  const fetchBoards = async () => {
    setIsFetchingBoards(true);
    // ... (restante da lógica de fetchBoards)
    try {
        const response = await axios.get<BoardType[]>(`${API_URL}/boards`);
        const fetchedBoards = response.data;
        setBoards(fetchedBoards);
        
        if (!currentBoard && fetchedBoards.length > 0) {
          setCurrentBoard(fetchedBoards[0]);
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

  const handleSelectBoard = (board: BoardType) => {
    setCurrentBoard(board);
  };
  
  // Criar Board
  const handleCreateBoard = async () => {
    const title = window.prompt("Digite o título do novo board:");
    if (!title || title.trim() === "") return;

    try {
      const response = await axios.post<BoardType>(`${API_URL}/boards`, { title });
      const newBoard = response.data;
      
      setBoards((prev) => {
          const updatedBoards = [...prev, newBoard];
          // Re-sort boards to maintain order: Main first, then by title
          updatedBoards.sort((a, b) => {
              if (a.isMainBoard && !b.isMainBoard) return -1;
              if (!a.isMainBoard && b.isMainBoard) return 1;
              return a.title.localeCompare(b.title);
          });
          return updatedBoards;
      });
      setCurrentBoard(newBoard); // Seleciona o novo board
      toast.success(`Board '${newBoard.title}' criado com sucesso!`);
    } catch (error) {
      console.error("Erro ao criar board:", error);
      toast.error("Falha ao criar board.");
    }
  };

  // Abrir Diálogo de Edição
  const handleOpenBoardEdit = () => {
    if (currentBoard && currentBoard.isMainBoard) {
        toast.error("Não é possível editar o Quadro Principal.");
    } else if (currentBoard) {
        setIsBoardDialogOpen(true);
    }
  };

  // Salvar Edição do Board
  const handleUpdateBoard = async (boardId: string, newTitle: string) => {
    if (!currentBoard || currentBoard.isMainBoard) return;
    setIsSavingBoard(true);
    try {
        const response = await axios.put<BoardType>(`${API_URL}/boards/${boardId}`, { title: newTitle });
        const updatedBoard = response.data;

        setBoards(prev => prev.map(b => b.id === boardId ? updatedBoard : b));
        setCurrentBoard(updatedBoard);
        
        toast.success("Board atualizado com sucesso!");
        setIsBoardDialogOpen(false);
    } catch (error) {
        console.error("Erro ao atualizar board:", error);
        // O erro do backend já protege contra edição do board principal
        toast.error("Falha ao atualizar board."); 
    } finally {
        setIsSavingBoard(false);
    }
  };
  
  // Excluir Board
  const handleDeleteBoard = async (boardId: string) => {
    if (!currentBoard || currentBoard.isMainBoard) {
        toast.error("Não é possível excluir o Quadro Principal.");
        return;
    }
    
    if (!window.confirm("ATENÇÃO: Excluir este board EXCLUIRÁ TODAS as colunas e tarefas nele. Continuar?")) {
        return;
    }

    try {
      await axios.delete(`${API_URL}/boards/${boardId}`);
      toast.success("Board excluído com sucesso.");

      // Remove o board da lista
      const newBoards = boards.filter(b => b.id !== boardId);
      setBoards(newBoards);
      
      // Seleciona o primeiro board restante como o novo currentBoard
      setCurrentBoard(newBoards.length > 0 ? newBoards[0] : null);
    } catch (error) {
      console.error("Erro ao deletar board:", error);
      // O erro do backend já protege contra exclusão do board principal
      toast.error("Falha ao deletar board.");
    }
  };
  
  if (isFetchingBoards && !currentBoard) {
    return <div className="p-6">Carregando boards...</div>;
  }
  
  if (!currentBoard) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-xl">Nenhum board encontrado. Tente recarregar ou crie um novo board.</p>
        </div>
    );
  }

  // Verifica se o usuário logado é o proprietário do board atual
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
        canManageBoard={canManageBoard} 
      />

      <Board 
        currentBoard={currentBoard}
        isAdmin={user?.role === 'ADMIN'}
        canManageBoard={canManageBoard}
      />
      
      {currentBoard && (
        <EditBoardDialog
          board={currentBoard}
          isOpen={isBoardDialogOpen}
          onOpenChange={setIsBoardDialogOpen}
          onSave={handleUpdateBoard}
          isSaving={isSavingBoard}
        />
      )}
    </div>
  );
}
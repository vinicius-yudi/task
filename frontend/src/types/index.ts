//
export interface Board {
  id: string;
  title: string;
  slug: string;
  isMainBoard: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  columnId: string;
  order: number;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  order: number;
  // Removida: userId: string;
  boardId: string; // Novo: Board ID
  createdAt: string;
  updatedAt: string;
}
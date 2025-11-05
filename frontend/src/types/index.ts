export interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  createdAt: string;
  userId: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}
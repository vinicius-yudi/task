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
  userId: string;
  createdAt: string;
  updatedAt: string;
}
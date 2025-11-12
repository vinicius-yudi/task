import { useAuth } from "@/contexts/AuthContext";

export function TypeUser() {
  const { user, isAdmin } = useAuth();

  return (
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
  );
}

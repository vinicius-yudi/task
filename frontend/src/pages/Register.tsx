import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5001/api/auth/register", {
        name,
        email,
        password,
      });
      toast.success("Cadastro realizado com sucesso! Faça login.");
      navigate("/login");
    } catch (error) {
      toast.error("Falha no cadastro. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-700">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle className="text-center text-slate-800 text-2xl font-bold">
            CADASTRA-SE
          </CardTitle>
          <CardDescription className="text-center">
            Crie uma conta para começar a gerenciar suas tarefas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="nome"
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Cadastrar
            </Button>

            <div className="text-center text-sm mt-4">
              <span className="text-slate-500">Já tem conta? </span>
              <Link to="/login" className="text-blue-600 hover:text-blue-400 font-medium">
                Faça Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
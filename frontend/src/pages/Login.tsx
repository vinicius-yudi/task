import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5001/api/auth/login",
        {
          email,
          password,
        },
        { withCredentials: true }
      );
      toast.success("Login realizado com sucesso!");
      login();
      navigate("/");
    } catch (error) {
      toast.error(
        "Falha no login. Verifique suas credenciais e tente novamente."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-700">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle className="text-center text-slate-800 text-2xl font-bold">
            LOGIN
          </CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email"></Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password"></Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>

            <div className="text-center text-sm mt-4">
              <span className="text-slate-500">Não tem conta? </span>
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-400 font-medium"
              >
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

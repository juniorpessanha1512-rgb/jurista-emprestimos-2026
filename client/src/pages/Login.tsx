import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Login() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Digite a senha");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Login realizado com sucesso!");
        // Pequeno delay para garantir que o cookie seja processado
        setTimeout(() => {
          navigate("/");
          window.location.reload(); // Força recarregamento para atualizar estado global
        }, 500);
      } else {
        const data = await response.json();
        toast.error(data.error || "Senha incorreta");
        setPassword("");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erro ao fazer login. Tente novamente.");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Empréstimos BM 2026</CardTitle>
          <CardDescription className="text-base">
            Digite sua senha para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Sistema de gerenciamento de empréstimos
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

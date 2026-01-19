import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

import { DollarSign, Users, TrendingUp, AlertCircle, Wallet, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: overdueLoans } = trpc.loans.getOverdue.useQuery();

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const totalLent = stats?.totalLent ? parseFloat(stats.totalLent) : 0;
  const totalReceived = stats?.totalReceived ? parseFloat(stats.totalReceived) : 0;
  const totalOnStreet = totalLent - totalReceived;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral do seu negócio de empréstimos
          </p>
        </div>

        {statsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total na Rua</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalOnStreet)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor emprestado menos pagamentos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Emprestado</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalLent)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.totalActiveLoans || 0} empréstimos ativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalReceived)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pagamentos realizados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Juros do Mês</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(stats?.monthlyInterest || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Previsão de juros mensal
                  </p>
                </CardContent>
              </Card>
            </div>

            {stats && stats.totalOverdue > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <CardTitle>Atenção: Empréstimos em Atraso</CardTitle>
                  </div>
                  <CardDescription>
                    Você tem {stats.totalOverdue} empréstimo(s) com pagamento vencido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="destructive">
                    <Link href="/overdue">
                      Ver Empréstimos em Atraso
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/clients">Gerenciar Clientes</Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/loans">Ver Empréstimos</Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/payments">Registrar Pagamento</Link>
                  </Button>
                </CardContent>
              </Card>

              {overdueLoans && overdueLoans.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Últimos Atrasos</CardTitle>
                    <CardDescription>Empréstimos que precisam de atenção</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {overdueLoans.slice(0, 3).map((item) => {
                        const loan = item.loan;
                        const client = item.client;
                        const daysOverdue = Math.floor(
                          (new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        
                        return (
                          <div key={loan.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div>
                              <p className="font-medium text-sm">{client?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {daysOverdue} dia(s) de atraso
                              </p>
                            </div>
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/loans/${loan.id}`}>Ver</Link>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

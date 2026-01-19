import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, DollarSign, Calendar, User, Phone, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Overdue() {
  const { user } = useAuth();
  const { data: overdueLoans, isLoading } = trpc.loans.getOverdue.useQuery();

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getInterestPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
    };
    return labels[period] || period;
  };

  const calculateDaysOverdue = (dueDate: Date | string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getOverdueSeverity = (days: number) => {
    if (days <= 7) return { color: "text-yellow-600 bg-yellow-50", label: "Recente" };
    if (days <= 30) return { color: "text-orange-600 bg-orange-50", label: "Moderado" };
    return { color: "text-red-600 bg-red-50", label: "Crítico" };
  };

  const totalOverdueAmount = overdueLoans?.reduce(
    (sum, item) => sum + parseFloat(item.loan.principalAmount),
    0
  ) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            Empréstimos em Atraso
          </h1>
          <p className="text-muted-foreground mt-2">
            Clientes com pagamentos vencidos que precisam de atenção
          </p>
        </div>

        {overdueLoans && overdueLoans.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Total em Atraso</CardTitle>
                <CardDescription>Soma dos valores principais em atraso</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-destructive">{formatCurrency(totalOverdueAmount)}</p>
              </CardContent>
            </Card>

            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Quantidade</CardTitle>
                <CardDescription>Número de empréstimos em atraso</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-destructive">{overdueLoans.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : overdueLoans && overdueLoans.length > 0 ? (
          <div className="space-y-4">
            {overdueLoans.map((item) => {
              const loan = item.loan;
              const client = item.client;
              const daysOverdue = calculateDaysOverdue(loan.dueDate);
              const severity = getOverdueSeverity(daysOverdue);

              return (
                <Card key={loan.id} className="border-destructive hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-6 w-6 text-destructive" />
                          <div>
                            <h3 className="font-bold text-xl">{client?.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${severity.color}`}>
                                {severity.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getInterestPeriodLabel(loan.interestPeriod)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Valor</p>
                              <p className="text-sm font-bold">{formatCurrency(loan.principalAmount)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">Dias de Atraso</p>
                              <p className="text-sm font-bold text-destructive">{daysOverdue} dias</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Vencimento</p>
                              <p className="text-sm">{formatDate(loan.dueDate)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Juros</p>
                              <p className="text-sm font-medium">{loan.interestRate}%</p>
                            </div>
                          </div>
                        </div>

                        {client?.phone && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Contato</p>
                              <p className="text-sm font-medium">{client.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/loans/${loan.id}`}>Ver Empréstimo</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/clients/${client?.id}`}>Ver Cliente</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-green-100 p-4 mb-4">
                <AlertCircle className="h-12 w-12 text-green-600" />
              </div>
              <p className="text-lg font-medium">Nenhum empréstimo em atraso!</p>
              <p className="text-sm text-muted-foreground">
                Todos os empréstimos estão em dia
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

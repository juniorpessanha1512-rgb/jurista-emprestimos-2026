import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { DollarSign, Calendar, User, FileText } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Payments() {
  const { user } = useAuth();
  const { data: payments, isLoading } = trpc.payments.list.useQuery();

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

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      principal: "Principal",
      interest: "Juros",
      both: "Principal + Juros",
    };
    return labels[type] || type;
  };

  const getPaymentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      principal: "text-blue-600 bg-blue-50",
      interest: "text-orange-600 bg-orange-50",
      both: "text-purple-600 bg-purple-50",
    };
    return colors[type] || "text-gray-600 bg-gray-50";
  };

  const totalPayments = payments?.reduce((sum, item) => sum + parseFloat(item.payment.amount), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground mt-2">
            Histórico completo de todos os pagamentos recebidos
          </p>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Total Recebido</CardTitle>
            <CardDescription>Soma de todos os pagamentos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{formatCurrency(totalPayments)}</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
        ) : payments && payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((item) => {
              const payment = item.payment;
              const loan = item.loan;
              const client = item.client;

              return (
                <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="font-bold text-xl">{formatCurrency(payment.amount)}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${getPaymentTypeColor(payment.paymentType)}`}>
                                {getPaymentTypeLabel(payment.paymentType)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Cliente</p>
                              <p className="text-sm font-medium">{client?.name}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Data do Pagamento</p>
                              <p className="text-sm">{formatDate(payment.paymentDate)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Empréstimo</p>
                              <p className="text-sm">
                                {loan ? formatCurrency(loan.principalAmount) : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {payment.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">{payment.notes}</p>
                          </div>
                        )}
                      </div>

                      {loan && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/loans/${loan.id}`}>Ver Empréstimo</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum pagamento encontrado</p>
              <p className="text-sm text-muted-foreground">
                Os pagamentos aparecerão aqui quando forem registrados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

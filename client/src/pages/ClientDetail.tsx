import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, User, Phone, MapPin, FileText, DollarSign, Calendar } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";

export default function ClientDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const clientId = parseInt(id || "0");

  const { data: client, isLoading: clientLoading } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: clientId > 0 }
  );

  const { data: loans, isLoading: loansLoading } = trpc.loans.getByClientId.useQuery(
    { clientId },
    { enabled: clientId > 0 }
  );

  if (!clientId || clientId === 0) {
    navigate("/clients");
    return null;
  }

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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: "Ativo",
      paid: "Pago",
      overdue: "Atrasado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "text-green-600 bg-green-50",
      paid: "text-blue-600 bg-blue-50",
      overdue: "text-red-600 bg-red-50",
      cancelled: "text-gray-600 bg-gray-50",
    };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {clientLoading ? (
          <Card>
            <CardHeader>
              <div className="h-8 bg-muted animate-pulse rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded"></div>
              </div>
            </CardContent>
          </Card>
        ) : client ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">{client.name}</CardTitle>
                    <CardDescription>Informações do Cliente</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {client.cpf && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">CPF</p>
                        <p className="text-sm text-muted-foreground">{client.cpf}</p>
                      </div>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Telefone</p>
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {client.address && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Endereço</p>
                        <p className="text-sm text-muted-foreground">{client.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {client.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium mb-1">Observações</p>
                      <p className="text-sm text-muted-foreground">{client.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Empréstimos</CardTitle>
                <CardDescription>
                  Todos os empréstimos realizados para este cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loansLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : loans && loans.length > 0 ? (
                  <div className="space-y-3">
                    {loans.map((loan) => (
                      <div
                        key={loan.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(loan.status)}`}>
                                {getStatusLabel(loan.status)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getInterestPeriodLabel(loan.interestPeriod)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Valor</p>
                                  <p className="text-sm font-medium">{formatCurrency(loan.principalAmount)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Juros</p>
                                  <p className="text-sm font-medium">{loan.interestRate}%</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Início</p>
                                  <p className="text-sm">{formatDate(loan.startDate)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Vencimento</p>
                                  <p className="text-sm">{formatDate(loan.dueDate)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/loans/${loan.id}`}>Ver Detalhes</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum empréstimo registrado para este cliente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">Cliente não encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

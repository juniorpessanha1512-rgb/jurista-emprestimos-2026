import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, User, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useParams, useLocation } from "wouter";

export default function LoanDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const loanId = parseInt(id || "0");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentType: "both" as "principal" | "interest" | "both",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: loanData, isLoading: loanLoading } = trpc.loans.getById.useQuery(
    { id: loanId },
    { enabled: loanId > 0 }
  );

  const { data: payments, isLoading: paymentsLoading } = trpc.payments.getByLoanId.useQuery(
    { loanId },
    { enabled: loanId > 0 }
  );

  const { data: interestCalc } = trpc.loans.calculateInterest.useQuery(
    {
      principalAmount: loanData?.loan ? parseFloat(loanData.loan.principalAmount) : 0,
      interestRate: loanData?.loan ? parseFloat(loanData.loan.interestRate) : 0,
      interestPeriod: loanData?.loan?.interestPeriod || "monthly",
      startDate: loanData?.loan?.startDate || new Date(),
      endDate: new Date(),
    },
    { enabled: !!loanData?.loan }
  );

  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado com sucesso!");
      utils.payments.getByLoanId.invalidate({ loanId });
      utils.loans.getById.invalidate({ id: loanId });
      utils.dashboard.stats.invalidate();
      setIsPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error) => {
      toast.error("Erro ao registrar pagamento: " + error.message);
    },
  });

  const deletePaymentMutation = trpc.payments.delete.useMutation({
    onSuccess: () => {
      toast.success("Pagamento excluído com sucesso!");
      utils.payments.getByLoanId.invalidate({ loanId });
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao excluir pagamento: " + error.message);
    },
  });

  const resetPaymentForm = () => {
    setPaymentData({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentType: "both",
      notes: "",
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createPaymentMutation.mutate({
      loanId,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate,
      paymentType: paymentData.paymentType,
      notes: paymentData.notes,
    });
  };

  const handleDeletePayment = (paymentId: number) => {
    if (confirm("Tem certeza que deseja excluir este pagamento?")) {
      deletePaymentMutation.mutate({ id: paymentId });
    }
  };

  if (!loanId || loanId === 0) {
    navigate("/loans");
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

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      principal: "Principal",
      interest: "Juros",
      both: "Principal + Juros",
    };
    return labels[type] || type;
  };

  const loan = loanData?.loan;
  const client = loanData?.client;

  // Calcular total de todos os pagamentos (para exibição)
  const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  
  // Calcular apenas pagamentos que afetam o principal (principal ou both)
  const totalPaidPrincipal = payments?.reduce((sum, p) => {
    if (p.paymentType === "principal" || p.paymentType === "both") {
      return sum + parseFloat(p.amount);
    }
    return sum;
  }, 0) || 0;
  
  const principalAmount = loan ? parseFloat(loan.principalAmount) : 0;
  const remainingBalance = principalAmount - totalPaidPrincipal;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/loans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {loanLoading ? (
          <Card>
            <CardHeader>
              <div className="h-8 bg-muted animate-pulse rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded"></div>
              </div>
            </CardContent>
          </Card>
        ) : loan && client ? (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <User className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Cliente</CardTitle>
                      <CardDescription>{client.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(loan.status)}`}>
                      {getStatusLabel(loan.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Periodicidade</span>
                    <span className="text-sm font-medium">{getInterestPeriodLabel(loan.interestPeriod)}</span>
                  </div>
                  
                  <Button asChild variant="outline" className="w-full mt-4">
                    <Link href={`/clients/${client.id}`}>Ver Cliente</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Valores</CardTitle>
                  <CardDescription>Informações financeiras do empréstimo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor Principal</span>
                    <span className="text-sm font-bold">{formatCurrency(loan.principalAmount)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa de Juros</span>
                    <span className="text-sm font-medium">{loan.interestRate}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Pago</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Saldo Restante</span>
                    <span className="text-lg font-bold">{formatCurrency(remainingBalance)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {interestCalc && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Cálculo de Juros Compostos
                  </CardTitle>
                  <CardDescription>
                    Cálculo desde {formatDate(loan.startDate)} até hoje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Períodos Decorridos</p>
                      <p className="text-2xl font-bold">{interestCalc.periods}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Juros Acumulados</p>
                      <p className="text-2xl font-bold text-orange-600">{formatCurrency(interestCalc.interestAmount)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(interestCalc.totalAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Datas</CardTitle>
                    <CardDescription>Cronograma do empréstimo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Início</p>
                      <p className="text-base font-medium">{formatDate(loan.startDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                      <p className="text-base font-medium">{formatDate(loan.dueDate)}</p>
                    </div>
                  </div>
                </div>
                
                {loan.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-1">Observações</p>
                    <p className="text-sm text-muted-foreground">{loan.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Pagamentos</CardTitle>
                    <CardDescription>Todos os pagamentos registrados</CardDescription>
                  </div>
                  
                  <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
                    setIsPaymentDialogOpen(open);
                    if (!open) resetPaymentForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Pagamento
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[450px]">
                      <form onSubmit={handlePaymentSubmit}>
                        <DialogHeader>
                          <DialogTitle>Registrar Pagamento</DialogTitle>
                          <DialogDescription>
                            Adicione um novo pagamento para este empréstimo
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="amount">Valor (R$) *</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              value={paymentData.amount}
                              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="paymentDate">Data do Pagamento *</Label>
                            <Input
                              id="paymentDate"
                              type="date"
                              value={paymentData.paymentDate}
                              onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="paymentType">Tipo de Pagamento *</Label>
                            <Select
                              value={paymentData.paymentType}
                              onValueChange={(value: any) => setPaymentData({ ...paymentData, paymentType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="principal">Principal</SelectItem>
                                <SelectItem value="interest">Juros</SelectItem>
                                <SelectItem value="both">Principal + Juros</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="paymentNotes">Observações</Label>
                            <Textarea
                              id="paymentNotes"
                              value={paymentData.notes}
                              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                              rows={2}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button type="submit" disabled={createPaymentMutation.isPending}>
                            Registrar
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : payments && payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold">{formatCurrency(payment.amount)}</span>
                            <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                              {getPaymentTypeLabel(payment.paymentType)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(payment.paymentDate)}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground">{payment.notes}</p>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum pagamento registrado ainda
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">Empréstimo não encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

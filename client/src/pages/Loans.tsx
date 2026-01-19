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
import { Plus, DollarSign, Calendar, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Loans() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: "",
    principalAmount: "",
    interestRate: "",
    interestPeriod: "monthly" as "weekly" | "biweekly" | "monthly",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: loans, isLoading } = trpc.loans.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const createMutation = trpc.loans.create.useMutation({
    onSuccess: () => {
      toast.success("Empréstimo cadastrado com sucesso!");
      utils.loans.list.invalidate();
      utils.dashboard.stats.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar empréstimo: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      clientId: "",
      principalAmount: "",
      interestRate: "",
      interestPeriod: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast.error("Selecione um cliente");
      return;
    }

    createMutation.mutate({
      clientId: parseInt(formData.clientId),
      principalAmount: formData.principalAmount,
      interestRate: formData.interestRate,
      interestPeriod: formData.interestPeriod,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      notes: formData.notes,
    });
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empréstimos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie todos os empréstimos realizados
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Empréstimo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Empréstimo</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do empréstimo
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Cliente *</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="principalAmount">Valor (R$) *</Label>
                      <Input
                        id="principalAmount"
                        type="number"
                        step="0.01"
                        value={formData.principalAmount}
                        onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Taxa de Juros (%) *</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.01"
                        value={formData.interestRate}
                        onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interestPeriod">Periodicidade dos Juros *</Label>
                    <Select
                      value={formData.interestPeriod}
                      onValueChange={(value: any) => setFormData({ ...formData, interestPeriod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data de Início *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Data de Vencimento *</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Cadastrar Empréstimo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
        ) : loans && loans.length > 0 ? (
          <div className="space-y-4">
            {loans.map((item) => {
              const loan = item.loan;
              const client = item.client;
              
              return (
                <Card key={loan.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-semibold text-lg">{client?.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(loan.status)}`}>
                                {getStatusLabel(loan.status)}
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
                              <p className="text-sm font-medium">{formatCurrency(loan.principalAmount)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum empréstimo encontrado</p>
              <p className="text-sm text-muted-foreground">
                Comece cadastrando seu primeiro empréstimo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

// Tela para registrar e consultar pagamentos.
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DollarSign, CreditCard, Wallet, Plus, TrendingDown, TrendingUp, Trash2 } from 'lucide-react';
import { apiRequest } from '../services/api';

interface Lancamento {
  _id: string;
  id_lancamento: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  status: 'pendente' | 'pago' | 'cancelado';
  forma_pagamento?: string;
  vencimento?: string;
  data_pagamento?: string;
  origem?: string;
  os_codigo?: string;
  cliente?: { nome?: string };
}

interface DashboardFinanceiro {
  competencia: string;
  resumo: {
    receitas_previstas: number;
    receitas_recebidas: number;
    despesas_previstas: number;
    despesas_pagas: number;
    saldo_previsto: number;
    saldo_realizado: number;
    pendente_receber: number;
    pendente_pagar: number;
  };
  lancamentos: Lancamento[];
}

const emptyForm = {
  tipo: 'receita',
  categoria: '',
  descricao: '',
  valor: '',
  status: 'pendente',
  forma_pagamento: 'pix',
  vencimento: '',
  data_pagamento: '',
  observacoes: '',
};

const moeda = (v?: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const hojeCompetencia = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const formatarData = (value?: string) => {
  if (!value) return 'Sem data';
  const data = new Date(value);
  return Number.isNaN(data.getTime()) ? 'Sem data' : data.toLocaleDateString('pt-BR');
};

export function Pagamentos() {
  const [dashboard, setDashboard] = useState<DashboardFinanceiro | null>(null);
  const [competencia, setCompetencia] = useState(hojeCompetencia());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      setDashboard(await apiRequest(`/financeiro/dashboard?competencia=${competencia}`));
    } catch (error: any) {
      alert(error.message || 'Erro ao carregar financeiro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [competencia]);

  const lancamentos = dashboard?.lancamentos || [];
  const resumo = dashboard?.resumo;
  const receitas = useMemo(() => lancamentos.filter((item) => item.tipo === 'receita'), [lancamentos]);
  const despesas = useMemo(() => lancamentos.filter((item) => item.tipo === 'despesa'), [lancamentos]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiRequest('/financeiro/lancamentos', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          valor: Number(form.valor || 0),
          competencia,
          data_pagamento: form.status === 'pago' ? (form.data_pagamento || new Date().toISOString()) : form.data_pagamento,
        }),
      });
      setDialogOpen(false);
      setForm(emptyForm);
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar lancamento');
    } finally {
      setSaving(false);
    }
  };

  const remover = async (id: string) => {
    if (!window.confirm('Remover lancamento financeiro?')) return;
    try {
      setSaving(true);
      await apiRequest(`/financeiro/lancamentos/${id}`, { method: 'DELETE' });
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao remover lancamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">Financeiro</h1>
          <p className="text-gray-600">Fluxo de caixa, contas a receber, contas a pagar e receitas de OS</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} className="w-40" />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setForm(emptyForm)}><Plus className="h-4 w-4 mr-2" />Lancamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo lancamento financeiro</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={salvar}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tipo</Label><Select value={form.tipo} onValueChange={(tipo) => setForm({ ...form, tipo })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Categoria</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Aluguel, OS, Compra de pecas" required /></div>
                  <div className="space-y-2"><Label>Valor</Label><Input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Descricao</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Data de pagamento</Label><Input type="date" value={form.data_pagamento} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })} /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Forma de pagamento</Label><Select value={form.forma_pagamento} onValueChange={(forma_pagamento) => setForm({ ...form, forma_pagamento })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="cartao_credito">Cartao credito</SelectItem><SelectItem value="cartao_debito">Cartao debito</SelectItem><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="transferencia">Transferencia</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2 md:col-span-2"><Label>Observacoes</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
                </div>
                <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Recebido</p><p className="text-2xl mt-2">{loading ? '...' : moeda(resumo?.receitas_recebidas)}</p><p className="text-xs text-gray-500">Previsto {moeda(resumo?.receitas_previstas)}</p></div><div className="p-3 bg-green-100 rounded-full"><TrendingUp className="h-6 w-6 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Despesas pagas</p><p className="text-2xl mt-2">{loading ? '...' : moeda(resumo?.despesas_pagas)}</p><p className="text-xs text-gray-500">Previsto {moeda(resumo?.despesas_previstas)}</p></div><div className="p-3 bg-red-100 rounded-full"><TrendingDown className="h-6 w-6 text-red-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Saldo realizado</p><p className="text-2xl mt-2">{loading ? '...' : moeda(resumo?.saldo_realizado)}</p><p className="text-xs text-gray-500">Previsto {moeda(resumo?.saldo_previsto)}</p></div><div className="p-3 bg-blue-100 rounded-full"><DollarSign className="h-6 w-6 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Pendencias</p><p className="text-2xl mt-2">{loading ? '...' : moeda((resumo?.pendente_receber || 0) - (resumo?.pendente_pagar || 0))}</p><p className="text-xs text-gray-500">A receber {moeda(resumo?.pendente_receber)} | A pagar {moeda(resumo?.pendente_pagar)}</p></div><div className="p-3 bg-yellow-100 rounded-full"><Wallet className="h-6 w-6 text-yellow-600" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Contas a receber</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {receitas.length === 0 ? <p className="text-sm text-gray-500">Nenhuma receita no periodo.</p> : receitas.map((item) => <LancamentoRow key={item._id} item={item} onRemove={remover} saving={saving} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" />Contas a pagar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {despesas.length === 0 ? <p className="text-sm text-gray-500">Nenhuma despesa no periodo.</p> : despesas.map((item) => <LancamentoRow key={item._id} item={item} onRemove={remover} saving={saving} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LancamentoRow({ item, onRemove, saving }: { item: Lancamento; onRemove: (id: string) => void; saving: boolean }) {
  return (
    <div className="rounded-md border p-4 text-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-gray-900">{item.descricao}</p>
            <Badge className={item.status === 'pago' ? 'bg-green-100 text-green-800' : item.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{item.status}</Badge>
            {item.origem === 'os' && <Badge className="bg-blue-100 text-blue-800">OS {item.os_codigo}</Badge>}
          </div>
          <p className="text-gray-600">{item.categoria} {item.cliente?.nome ? `- ${item.cliente.nome}` : ''}</p>
          <p className="text-gray-500">Vencimento: {formatarData(item.vencimento)} | Pagamento: {formatarData(item.data_pagamento)}</p>
        </div>
        <div className="flex items-center gap-2 md:text-right">
          <p className={item.tipo === 'receita' ? 'font-medium text-green-700' : 'font-medium text-red-700'}>{item.tipo === 'receita' ? '+' : '-'} {moeda(item.valor)}</p>
          {item.origem !== 'os' && <Button variant="outline" size="icon" onClick={() => onRemove(item._id)} disabled={saving}><Trash2 className="h-4 w-4" /></Button>}
        </div>
      </div>
    </div>
  );
}

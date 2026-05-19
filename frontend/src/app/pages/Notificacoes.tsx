// Central de notificacoes internas do usuario.
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { apiRequest } from '../services/api';
import { Bell, CheckCircle, Mail, MessageCircle, Plus, Send, XCircle } from 'lucide-react';

interface Notificacao {
  _id: string;
  id_notificacao: string;
  canal: 'whatsapp' | 'email' | 'interno';
  tipo: string;
  status: 'pendente' | 'enviado' | 'erro' | 'cancelado';
  destinatario?: {
    nome?: string;
    telefone?: string;
    email?: string;
  };
  assunto?: string;
  mensagem: string;
  entidade_codigo?: string;
  tentativas?: number;
  enviado_em?: string;
  createdAt?: string;
}

const emptyForm = {
  canal: 'whatsapp',
  nome: '',
  telefone: '',
  email: '',
  assunto: '',
  mensagem: '',
};

const statusClass: Record<Notificacao['status'], string> = {
  pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  enviado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  erro: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const canalIcon = {
  whatsapp: MessageCircle,
  email: Mail,
  interno: Bell,
};

const formatarData = (data?: string) => (data ? new Date(data).toLocaleString('pt-BR') : 'N/A');

export function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [status, setStatus] = useState('todas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      const query = status === 'todas' ? '' : `?status=${status}`;
      const data = await apiRequest(`/notificacoes${query}`);
      setNotificacoes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      alert(error.message || 'Erro ao carregar notificacoes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [status]);

  const resumo = useMemo(() => ({
    total: notificacoes.length,
    pendentes: notificacoes.filter((item) => item.status === 'pendente').length,
    enviadas: notificacoes.filter((item) => item.status === 'enviado').length,
    erros: notificacoes.filter((item) => item.status === 'erro').length,
  }), [notificacoes]);

  const criar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.mensagem.trim()) return alert('Informe a mensagem');
    if (form.canal === 'whatsapp' && !form.telefone.trim()) return alert('Informe o telefone');
    if (form.canal === 'email' && !form.email.trim()) return alert('Informe o e-mail');

    try {
      setSaving(true);
      await apiRequest('/notificacoes', {
        method: 'POST',
        body: JSON.stringify({
          canal: form.canal,
          tipo: 'manual',
          assunto: form.assunto,
          mensagem: form.mensagem,
          destinatario: {
            nome: form.nome,
            telefone: form.telefone,
            email: form.email,
          },
        }),
      });
      setForm(emptyForm);
      setDialogOpen(false);
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar notificacao');
    } finally {
      setSaving(false);
    }
  };

  const enviar = async (id: string) => {
    try {
      await apiRequest(`/notificacoes/${id}/enviar`, { method: 'POST' });
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar notificacao');
    }
  };

  const cancelar = async (id: string) => {
    try {
      await apiRequest(`/notificacoes/${id}/cancelar`, { method: 'POST' });
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao cancelar notificacao');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Automacoes e notificacoes</h1>
          <p className="text-gray-600 dark:text-gray-400">Fila profissional para WhatsApp, e-mail e comunicados internos.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="enviado">Enviadas</SelectItem>
              <SelectItem value="erro">Com erro</SelectItem>
              <SelectItem value="cancelado">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nova mensagem</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Mensagem manual</DialogTitle>
              </DialogHeader>
              <form onSubmit={criar} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Canal</Label>
                    <Select value={form.canal} onValueChange={(value) => setForm({ ...form, canal: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="interno">Interno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nome</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Cliente ou equipe" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" />
                  </div>
                </div>
                <div>
                  <Label>Assunto</Label>
                  <Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} placeholder="Opcional para WhatsApp" />
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Textarea rows={5} value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} placeholder="Digite a mensagem que sera enviada..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar notificacao'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-semibold">{resumo.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Pendentes</p><p className="text-2xl font-semibold text-amber-700">{resumo.pendentes}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Enviadas</p><p className="text-2xl font-semibold text-emerald-700">{resumo.enviadas}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">Erros</p><p className="text-2xl font-semibold text-red-700">{resumo.erros}</p></CardContent></Card>
      </div>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-gray-500">Carregando notificacoes...</CardContent></Card>
      ) : notificacoes.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">Nenhuma notificacao encontrada</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {notificacoes.map((item) => {
            const Icon = canalIcon[item.canal] || Bell;
            return (
              <Card key={item._id}>
                <CardHeader className="gap-3 md:flex md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusClass[item.status]}>{item.status}</Badge>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                        <Icon className="mr-1 h-3 w-3" />{item.canal}
                      </Badge>
                      <span className="text-sm text-gray-500">{item.id_notificacao}</span>
                      {item.entidade_codigo && <span className="text-sm text-gray-500">{item.entidade_codigo}</span>}
                    </div>
                    <CardTitle className="text-base">{item.assunto || item.tipo}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {item.status === 'pendente' && (
                      <>
                        <Button size="sm" onClick={() => enviar(item._id)}><Send className="mr-2 h-4 w-4" />Enviar</Button>
                        <Button size="sm" variant="outline" onClick={() => cancelar(item._id)}><XCircle className="mr-2 h-4 w-4" />Cancelar</Button>
                      </>
                    )}
                    {item.status === 'enviado' && <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="mr-1 h-3 w-3" />Enviado</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{item.mensagem}</p>
                  <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-3">
                    <p><strong>Destinatario:</strong> {item.destinatario?.nome || item.destinatario?.telefone || item.destinatario?.email || 'N/A'}</p>
                    <p><strong>Criada em:</strong> {formatarData(item.createdAt)}</p>
                    <p><strong>Enviada em:</strong> {formatarData(item.enviado_em)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

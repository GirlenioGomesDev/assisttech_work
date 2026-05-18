import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Smartphone, FileText, DollarSign, User, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { apiRequest } from '../services/api';
import { formatCpf, formatPhone } from '../utils/onlyDigits';

interface Cliente {
  _id: string;
  id_cliente: string;
  nome: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  cpf?: string;
  observacoes?: string;
  endereco?: { rua?: string; numero?: string; bairro?: string; cidade?: string; estado?: string };
}

interface OrdemServico {
  _id: string;
  id_os: string;
  status: string;
  createdAt?: string;
  prazo_estimado?: string;
  defeito_relatado?: string;
  aparelho?: { marca?: string; modelo?: string; tipo_aparelho?: string; cor?: string; imei_ou_serial?: string };
  orcamento?: { valor_total?: number; status_aprovacao?: string };
  pagamento?: { valor_final?: number; status_pagamento?: string };
}

interface AparelhoResumo {
  chave: string;
  tipo_aparelho?: string;
  marca?: string;
  modelo?: string;
  cor?: string;
  imei_ou_serial?: string;
  total_os: number;
  ultima_os?: { _id: string; id_os: string; status: string; createdAt?: string };
}

interface ClienteResumo {
  cliente: Cliente;
  resumo: {
    total_os: number;
    os_abertas: number;
    os_entregues: number;
    os_canceladas: number;
    aparelhos: number;
    total_orcamentos: number;
    total_pago: number;
    saldo_pendente: number;
    ticket_medio: number;
    recorrente: boolean;
    score: number;
    ultima_os?: { _id: string; id_os: string; status: string; createdAt?: string };
  };
  aparelhos: AparelhoResumo[];
  ordens: OrdemServico[];
}

const statusLabel: Record<string, string> = {
  aberta: 'Aberta',
  em_diagnostico: 'Em diagnostico',
  aguardando_aprovacao: 'Aguardando aprovacao',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  em_reparo: 'Em reparo',
  aguardando_peca: 'Aguardando peca',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

const moeda = (valor?: number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (valor?: string) => {
  if (!valor) return 'Nao informado';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? 'Nao informado' : d.toLocaleDateString('pt-BR');
};

export function HistoricoCliente() {
  const { id } = useParams();
  const [dados, setDados] = useState<ClienteResumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setDados(await apiRequest(`/clientes/${id}/resumo`));
      } catch (error: any) {
        alert(error.message || 'Erro ao carregar perfil do cliente');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [id]);

  if (loading) return <Card><CardContent className="p-10 text-center text-gray-500">Carregando perfil 360...</CardContent></Card>;
  if (!dados) return <Card><CardContent className="p-10 text-center text-gray-500">Cliente nao encontrado</CardContent></Card>;

  const { cliente, resumo, aparelhos, ordens } = dados;
  const scoreColor = resumo.score >= 75 ? 'bg-emerald-100 text-emerald-800' : resumo.score >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/clientes"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl text-gray-900">Cliente 360</h1>
              {resumo.recorrente && <Badge className="bg-blue-100 text-blue-800">Recorrente</Badge>}
              {resumo.saldo_pendente > 0 && <Badge className="bg-red-100 text-red-800">Pendencia financeira</Badge>}
            </div>
            <p className="text-gray-600">{cliente.nome}</p>
          </div>
        </div>
        <Badge className={scoreColor}>Score {resumo.score}/100</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Ordens de servico</p><p className="text-3xl mt-2">{resumo.total_os}</p><p className="text-xs text-gray-500 mt-1">{resumo.os_abertas} abertas</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Aparelhos</p><p className="text-3xl mt-2">{resumo.aparelhos}</p><p className="text-xs text-gray-500 mt-1">Historico por aparelho</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Total contratado</p><p className="text-2xl mt-2">{moeda(resumo.total_orcamentos)}</p><p className="text-xs text-gray-500 mt-1">Ticket medio {moeda(resumo.ticket_medio)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Saldo pendente</p><p className="text-2xl mt-2">{moeda(resumo.saldo_pendente)}</p><p className="text-xs text-gray-500 mt-1">Pago {moeda(resumo.total_pago)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Dados do cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p><strong>Codigo:</strong> {cliente.id_cliente}</p>
            <p><strong>Telefone:</strong> {formatPhone(cliente.telefone || cliente.whatsapp || '') || 'Nao informado'}</p>
            <p><strong>WhatsApp:</strong> {formatPhone(cliente.whatsapp || cliente.telefone || '') || 'Nao informado'}</p>
            <p><strong>E-mail:</strong> {cliente.email || 'Nao informado'}</p>
            <p><strong>CPF:</strong> {formatCpf(cliente.cpf || '') || 'Nao informado'}</p>
            {(cliente.endereco?.rua || cliente.endereco?.cidade) && (
              <p><strong>Endereco:</strong> {[cliente.endereco?.rua, cliente.endereco?.numero, cliente.endereco?.bairro, cliente.endereco?.cidade, cliente.endereco?.estado].filter(Boolean).join(', ')}</p>
            )}
            {cliente.observacoes && <div className="rounded-md border bg-yellow-50 p-3 text-yellow-900"><strong>Observacao interna:</strong> {cliente.observacoes}</div>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Inteligencia do relacionamento</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-md border p-4">
              <p className="text-gray-500">Ultima OS</p>
              {resumo.ultima_os ? <Link to={`/ordem-servico/${resumo.ultima_os._id}`} className="mt-1 block font-medium text-blue-700">{resumo.ultima_os.id_os} - {statusLabel[resumo.ultima_os.status] || resumo.ultima_os.status}</Link> : <p className="mt-1 font-medium">Sem OS</p>}
            </div>
            <div className="rounded-md border p-4">
              <p className="text-gray-500">Risco</p>
              <p className="mt-1 font-medium">{resumo.saldo_pendente > 0 ? 'Financeiro pendente' : resumo.os_canceladas > 0 ? 'Cancelamentos no historico' : 'Baixo risco'}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-gray-500">Perfil</p>
              <p className="mt-1 font-medium">{resumo.recorrente ? 'Cliente recorrente' : resumo.total_os > 0 ? 'Cliente ativo' : 'Cliente novo'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />Aparelhos do cliente</CardTitle></CardHeader>
        <CardContent>
          {aparelhos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum aparelho registrado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aparelhos.map((aparelho) => (
                <div key={aparelho.chave} className="rounded-md border p-4">
                  <p className="font-medium text-gray-900">{aparelho.marca || 'Sem marca'} {aparelho.modelo || ''}</p>
                  <p className="text-sm text-gray-600">{aparelho.tipo_aparelho || 'Tipo nao informado'} {aparelho.cor ? `- ${aparelho.cor}` : ''}</p>
                  <p className="text-sm text-gray-600">IMEI/Serial: {aparelho.imei_ou_serial || 'Nao informado'}</p>
                  <p className="text-xs text-gray-500 mt-2">{aparelho.total_os} OS vinculada(s)</p>
                  {aparelho.ultima_os && <Link to={`/ordem-servico/${aparelho.ultima_os._id}`} className="mt-2 inline-flex text-sm text-blue-700">Ver ultima OS</Link>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Ordens e financeiro</CardTitle></CardHeader>
        <CardContent>
          {ordens.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma ordem de servico encontrada para este cliente.</p>
          ) : (
            <div className="space-y-3">
              {ordens.map((os) => (
                <Link key={os._id} to={`/ordem-servico/${os._id}`} className="block rounded-lg border p-4 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900 flex items-center gap-2"><FileText className="h-4 w-4" />OS #{os.id_os}</p>
                      <p className="text-sm text-gray-700 flex items-center gap-2"><Smartphone className="h-4 w-4" />{os.aparelho?.marca || '---'} {os.aparelho?.modelo || ''} - {os.aparelho?.tipo_aparelho || 'sem tipo'}</p>
                      <p className="text-sm text-gray-600">Defeito: {os.defeito_relatado || 'Nao informado'}</p>
                    </div>
                    <div className="text-sm md:text-right space-y-1">
                      <p className="font-medium">{statusLabel[os.status] || os.status}</p>
                      <p className="text-gray-600 flex items-center md:justify-end gap-1"><DollarSign className="h-4 w-4" />{moeda(os.orcamento?.valor_total)}</p>
                      <p className="text-gray-500 flex items-center md:justify-end gap-1"><Clock className="h-4 w-4" />{data(os.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {resumo.saldo_pendente > 0 && (
        <Card>
          <CardContent className="flex items-start gap-3 p-5 text-sm text-red-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>Este cliente possui saldo pendente. Recomenda-se validar pagamento antes de liberar novas entregas ou condicoes especiais.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

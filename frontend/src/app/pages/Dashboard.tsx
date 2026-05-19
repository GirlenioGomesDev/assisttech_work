// Tela inicial com resumo dos principais indicadores.
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FileText, Wrench, CheckCircle, Clock, AlertCircle, TrendingUp, DollarSign, Package, Users, Timer } from 'lucide-react';
import { Link } from 'react-router';
import { apiRequest } from '../services/api';

interface OrdemServico {
  _id: string;
  id_os: string;
  status: string;
  prioridade?: string;
  defeito_relatado?: string;
  prazo_estimado?: string;
  createdAt?: string;
  cliente?: { nome?: string };
  tecnico?: { nome?: string };
}

interface DashboardData {
  periodo: string;
  resumo: {
    total_os: number;
    os_ativas: number;
    os_atrasadas: number;
    os_prontas: number;
    os_entregues: number;
    aguardando_aprovacao: number;
    faturamento: number;
    despesas: number;
    lucro: number;
    ticket_medio: number;
    tempo_medio_reparo_horas: number;
    estoque_baixo: number;
    valor_estoque: number;
  };
  graficos: { por_status: Array<{ name: string; quantidade: number }> };
  rankings: {
    tecnicos: Array<{ name: string; quantidade: number; entregues: number; faturamento: number }>;
    pecas_mais_usadas: Array<{ name: string; quantidade: number; valor: number }>;
  };
  alertas: Array<{ tipo: string; titulo: string; descricao: string; id: string }>;
  listas: {
    os_ativas: OrdemServico[];
    os_atrasadas: OrdemServico[];
    estoque_baixo: Array<{ _id: string; nome: string; quantidade: number; estoque_minimo: number }>;
  };
}

const statusMeta: Record<string, { label: string; badge: string }> = {
  aberta: { label: 'Aberta', badge: 'bg-blue-100 text-blue-800' },
  em_diagnostico: { label: 'Em diagnostico', badge: 'bg-purple-100 text-purple-800' },
  aguardando_aprovacao: { label: 'Aguardando aprovacao', badge: 'bg-yellow-100 text-yellow-800' },
  aprovado: { label: 'Aprovado', badge: 'bg-emerald-100 text-emerald-800' },
  rejeitado: { label: 'Rejeitado', badge: 'bg-red-100 text-red-800' },
  em_reparo: { label: 'Em reparo', badge: 'bg-orange-100 text-orange-800' },
  aguardando_peca: { label: 'Aguardando peca', badge: 'bg-pink-100 text-pink-800' },
  pronto: { label: 'Pronto', badge: 'bg-green-100 text-green-800' },
  entregue: { label: 'Entregue', badge: 'bg-gray-100 text-gray-800' },
  cancelada: { label: 'Cancelada', badge: 'bg-zinc-100 text-zinc-800' },
};

const moeda = (valor?: number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (value?: string) => {
  if (!value) return 'Nao informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Nao informada' : date.toLocaleDateString('pt-BR');
};

export function Dashboard() {
  const [periodo, setPeriodo] = useState('mes');
  const [dataDashboard, setDataDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setDataDashboard(await apiRequest(`/dashboard/executivo?periodo=${periodo}`));
      } catch (error: any) {
        alert(error.message || 'Erro ao carregar dashboard');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [periodo]);

  const resumo = dataDashboard?.resumo;
  const stats = [
    { name: 'OS ativas', value: resumo?.os_ativas, icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { name: 'OS atrasadas', value: resumo?.os_atrasadas, icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    { name: 'Prontas', value: resumo?.os_prontas, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    { name: 'Aguardando aprovacao', value: resumo?.aguardando_aprovacao, icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { name: 'Estoque baixo', value: resumo?.estoque_baixo, icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { name: 'Tempo medio', value: `${resumo?.tempo_medio_reparo_horas || 0}h`, icon: Timer, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Dashboard executivo</h1>
          <p className="text-gray-600">Operacao, financeiro, estoque e produtividade em tempo real</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Ultimos 7 dias</SelectItem>
            <SelectItem value="mes">Ultimos 30 dias</SelectItem>
            <SelectItem value="ano">Ultimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Faturamento</p><p className="text-2xl mt-2">{loading ? '...' : moeda(resumo?.faturamento)}</p><p className="text-xs text-gray-500">Ticket {moeda(resumo?.ticket_medio)}</p></div><div className="p-3 bg-green-100 rounded-full"><DollarSign className="h-6 w-6 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Lucro realizado</p><p className="text-2xl mt-2">{loading ? '...' : moeda(resumo?.lucro)}</p><p className="text-xs text-gray-500">Despesas {moeda(resumo?.despesas)}</p></div><div className="p-3 bg-blue-100 rounded-full"><TrendingUp className="h-6 w-6 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">OS entregues</p><p className="text-2xl mt-2">{loading ? '...' : resumo?.os_entregues}</p><p className="text-xs text-gray-500">Total {resumo?.total_os || 0}</p></div><div className="p-3 bg-emerald-100 rounded-full"><Wrench className="h-6 w-6 text-emerald-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Valor em estoque</p><p className="text-2xl mt-2">{loading ? '...' : moeda(resumo?.valor_estoque)}</p><p className="text-xs text-gray-500">{resumo?.estoque_baixo || 0} alertas</p></div><div className="p-3 bg-orange-100 rounded-full"><Package className="h-6 w-6 text-orange-600" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                    <p className="text-3xl mt-2">{loading ? '...' : stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Ordens em andamento</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-gray-500 py-4 text-center">Carregando...</p> : !dataDashboard?.listas.os_ativas.length ? <p className="text-sm text-gray-500 py-4 text-center">Nenhuma OS ativa</p> : (
              <div className="space-y-3">
                {dataDashboard.listas.os_ativas.map((os) => (
                  <Link key={os._id} to={`/ordem-servico/${os._id}`} className="block rounded-lg border p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">OS #{os.id_os}</p>
                        <p className="text-xs text-gray-500 mt-1">{os.cliente?.nome || 'Cliente nao informado'}</p>
                        <p className="text-xs text-gray-500 mt-1">{os.defeito_relatado || 'Sem defeito relatado'}</p>
                      </div>
                      <Badge className={statusMeta[os.status]?.badge || 'bg-gray-100 text-gray-800'}>{statusMeta[os.status]?.label || os.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                      <span>Previsao: {data(os.prazo_estimado)}</span>
                      {os.tecnico?.nome && <span>Tecnico: {os.tecnico.nome}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Alertas inteligentes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!dataDashboard?.alertas.length ? <p className="text-sm text-gray-500">Nenhum alerta critico.</p> : dataDashboard.alertas.map((alerta, index) => (
              <div key={`${alerta.tipo}-${alerta.id}-${index}`} className="rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className={alerta.tipo === 'atraso' ? 'h-4 w-4 text-red-600' : 'h-4 w-4 text-yellow-600'} />
                  <p className="font-medium text-gray-900">{alerta.titulo}</p>
                </div>
                <p className="mt-1 text-gray-600">{alerta.descricao}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Tecnicos mais produtivos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!dataDashboard?.rankings.tecnicos.length ? <p className="text-sm text-gray-500">Sem dados no periodo.</p> : dataDashboard.rankings.tecnicos.map((item) => (
              <div key={item.name} className="rounded-md border p-3 text-sm">
                <div className="flex justify-between gap-3"><span className="font-medium">{item.name}</span><strong>{item.quantidade} OS</strong></div>
                <p className="text-gray-500">{item.entregues} entregues | {moeda(item.faturamento)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pecas mais usadas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!dataDashboard?.rankings.pecas_mais_usadas.length ? <p className="text-sm text-gray-500">Sem pecas registradas no periodo.</p> : dataDashboard.rankings.pecas_mais_usadas.map((item) => (
              <div key={item.name} className="flex justify-between rounded-md border p-3 text-sm">
                <span>{item.name}</span>
                <strong>{item.quantidade}</strong>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Estoque critico</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!dataDashboard?.listas.estoque_baixo.length ? <p className="text-sm text-gray-500">Nenhum item critico.</p> : dataDashboard.listas.estoque_baixo.map((item) => (
              <div key={item._id} className="flex justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <span>{item.nome}</span>
                <strong>{item.quantidade} / {item.estoque_minimo}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

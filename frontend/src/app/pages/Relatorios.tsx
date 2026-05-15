import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, TrendingUp, Wrench } from 'lucide-react';
import { apiRequest } from '../services/api';

interface RelatorioEmpresa {
  resumo: {
    total_servicos: number;
    concertos_feitos: number;
    entregues: number;
    pecas_vendidas: number;
    pecas_em_estoque: number;
    valor_em_estoque: number;
    gasto_pecas: number;
    faturamento: number;
    mao_obra: number;
    lucro_estimado: number;
    investimento: number;
    estoque_baixo: number;
  };
  graficos: {
    por_status: Array<{ name: string; quantidade: number }>;
    aparelhos_mais_atendidos: Array<{ name: string; quantidade: number }>;
    tecnicos_mais_atendimentos: Array<{ name: string; quantidade: number }>;
  };
  estoque_baixo: Array<{ id_item: string; nome: string; quantidade: number; estoque_minimo: number }>;
}

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#7c3aed', '#0891b2', '#f97316', '#64748b'];
const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_diagnostico: 'Em diagnóstico',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  em_reparo: 'Em reparo',
  aguardando_peca: 'Aguardando peça',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

const moeda = (valor: number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Relatorios() {
  const [periodo, setPeriodo] = useState('mes');
  const [data, setData] = useState<RelatorioEmpresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setData(await apiRequest(`/relatorios/empresa?periodo=${periodo}`));
      } catch (error: any) {
        alert(error.message || 'Erro ao carregar relatórios');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [periodo]);

  const resumo = data?.resumo;
  const porStatus = (data?.graficos.por_status || []).map((item) => ({
    ...item,
    name: statusLabels[item.name] || item.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Relatórios da Empresa</h1>
          <p className="text-gray-600">Indicadores internos de estoque, serviços, custos e lucro</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Últimos 7 dias</SelectItem>
            <SelectItem value="mes">Últimos 30 dias</SelectItem>
            <SelectItem value="ano">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading || !resumo ? (
        <Card><CardContent className="p-12 text-center text-gray-500">Carregando relatórios...</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Faturamento</p><p className="text-2xl mt-2">{moeda(resumo.faturamento)}</p></div><DollarSign className="h-6 w-6 text-emerald-600" /></div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Lucro estimado</p><p className="text-2xl mt-2">{moeda(resumo.lucro_estimado)}</p></div><TrendingUp className="h-6 w-6 text-green-600" /></div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Gasto com peças</p><p className="text-2xl mt-2">{moeda(resumo.gasto_pecas)}</p></div><Package className="h-6 w-6 text-orange-600" /></div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Concertos feitos</p><p className="text-2xl mt-2">{resumo.concertos_feitos}</p></div><Wrench className="h-6 w-6 text-blue-600" /></div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Peças vendidas/usadas</p><p className="text-2xl mt-2">{resumo.pecas_vendidas}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Peças em estoque</p><p className="text-2xl mt-2">{resumo.pecas_em_estoque}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Valor em estoque</p><p className="text-2xl mt-2">{moeda(resumo.valor_em_estoque)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-gray-600">Investimento</p><p className="text-2xl mt-2">{moeda(resumo.investimento)}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Ordens por status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={porStatus} cx="50%" cy="50%" outerRadius={85} dataKey="quantidade" label={({ name, quantidade }) => `${name}: ${quantidade}`}>
                      {porStatus.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Aparelhos mais atendidos</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.graficos.aparelhos_mais_atendidos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Técnicos com mais atendimentos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.graficos.tecnicos_mais_atendimentos.length ? data.graficos.tecnicos_mais_atendimentos.map((item) => (
                  <div key={item.name} className="flex justify-between rounded-md bg-gray-50 p-3 text-sm">
                    <span>{item.name}</span>
                    <strong>{item.quantidade} OS</strong>
                  </div>
                )) : <p className="text-sm text-gray-500">Sem atendimentos no período</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Itens com estoque baixo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.estoque_baixo.length ? data.estoque_baixo.map((item) => (
                  <div key={item.id_item} className="flex justify-between rounded-md bg-red-50 p-3 text-sm text-red-900">
                    <span>{item.nome}</span>
                    <strong>{item.quantidade} / mín. {item.estoque_minimo}</strong>
                  </div>
                )) : <p className="text-sm text-gray-500">Nenhum item em estoque baixo</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

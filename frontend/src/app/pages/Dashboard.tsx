import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Wrench, CheckCircle, Clock, AlertCircle, TrendingUp, Search } from 'lucide-react';
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

const statusMeta: Record<string, { label: string; badge: string }> = {
  aberta: { label: 'Aberta', badge: 'bg-blue-100 text-blue-800' },
  em_diagnostico: { label: 'Em diagnóstico', badge: 'bg-purple-100 text-purple-800' },
  aguardando_aprovacao: { label: 'Aguardando aprovação', badge: 'bg-yellow-100 text-yellow-800' },
  aprovado: { label: 'Aprovado', badge: 'bg-emerald-100 text-emerald-800' },
  rejeitado: { label: 'Rejeitado', badge: 'bg-red-100 text-red-800' },
  em_reparo: { label: 'Em reparo', badge: 'bg-orange-100 text-orange-800' },
  aguardando_peca: { label: 'Aguardando peça', badge: 'bg-pink-100 text-pink-800' },
  pronto: { label: 'Pronto', badge: 'bg-green-100 text-green-800' },
  entregue: { label: 'Entregue', badge: 'bg-gray-100 text-gray-800' },
  cancelada: { label: 'Cancelada', badge: 'bg-zinc-100 text-zinc-800' },
};

export function Dashboard() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/os');
        setOrdens(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        alert('Erro ao carregar o dashboard');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const hoje = new Date().toDateString();

  const stats = useMemo(() => {
    const abertas = ordens.filter((os) => os.status === 'aberta').length;
    const diagnostico = ordens.filter((os) => os.status === 'em_diagnostico').length;
    const reparo = ordens.filter((os) => os.status === 'em_reparo').length;
    const prontas = ordens.filter((os) => os.status === 'pronto').length;
    const concluidasHoje = ordens.filter((os) => os.status === 'entregue' && os.createdAt && new Date(os.createdAt).toDateString() === hoje).length;
    const atrasadas = ordens.filter((os) => os.prazo_estimado && new Date(os.prazo_estimado) < new Date() && !['entregue', 'cancelada'].includes(os.status)).length;

    return [
      { name: 'OS abertas', value: abertas, icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { name: 'Em diagnóstico', value: diagnostico, icon: Search, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { name: 'Em reparo', value: reparo, icon: Wrench, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      { name: 'Prontas', value: prontas, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
      { name: 'Concluídas hoje', value: concluidasHoje, icon: TrendingUp, color: 'text-teal-600', bgColor: 'bg-teal-100' },
      { name: 'OS com atraso', value: atrasadas, icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    ];
  }, [ordens]);

  const osAtivas = ordens.filter((os) => !['entregue', 'cancelada'].includes(os.status)).slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-1">Visão Geral</h1>
        <p className="text-gray-600">Acompanhe as ordens de serviço em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Ordens em andamento</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500 py-4 text-center">Carregando...</p>
          ) : osAtivas.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhuma ordem de serviço em andamento</p>
          ) : (
            <div className="space-y-3">
              {osAtivas.map((os) => (
                <Link
                  key={os._id}
                  to={`/ordem-servico/${os._id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">OS #{os.id_os}</p>
                      <p className="text-xs text-gray-500 mt-1">{os.cliente?.nome || 'Cliente não informado'}</p>
                      <p className="text-xs text-gray-500 mt-1">{os.defeito_relatado || 'Sem defeito relatado'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${statusMeta[os.status]?.badge || 'bg-gray-100 text-gray-800'}`}>
                      {statusMeta[os.status]?.label || os.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Previsão: {os.prazo_estimado ? new Date(os.prazo_estimado).toLocaleDateString('pt-BR') : 'Não informada'}
                    </span>
                    {os.tecnico?.nome && <span>Técnico: {os.tecnico.nome}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

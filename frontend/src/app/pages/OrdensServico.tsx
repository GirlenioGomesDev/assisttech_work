import { useEffect, useState } from 'react';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Search, Calendar, User } from 'lucide-react';
import { Link } from 'react-router';
import { apiRequest } from '../services/api';

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

const statusColors: Record<string, string> = {
  aberta: 'bg-blue-100 text-blue-800',
  em_diagnostico: 'bg-purple-100 text-purple-800',
  aguardando_aprovacao: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-emerald-100 text-emerald-800',
  rejeitado: 'bg-red-100 text-red-800',
  em_reparo: 'bg-orange-100 text-orange-800',
  aguardando_peca: 'bg-pink-100 text-pink-800',
  pronto: 'bg-green-100 text-green-800',
  entregue: 'bg-gray-100 text-gray-800',
  cancelada: 'bg-zinc-100 text-zinc-800',
};

interface OrdemServico {
  _id: string;
  id_os: string;
  status: string;
  prioridade?: string;
  createdAt?: string;
  prazo_estimado?: string;
  defeito_relatado?: string;
  cliente?: { nome?: string };
  tecnico?: { id_usuario?: string; nome?: string };
  aparelho?: { marca?: string; modelo?: string };
}

interface Usuario {
  _id: string;
  id_usuario: string;
  nome: string;
}

export function OrdensServico() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [tecnicoFilter, setTecnicoFilter] = useState<string>('todos');
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [ordensData, tecnicosData] = await Promise.all([
          apiRequest('/os'),
          apiRequest('/usuarios/tecnicos'),
        ]);
        setOrdens(Array.isArray(ordensData) ? ordensData : []);
        setTecnicos(Array.isArray(tecnicosData) ? tecnicosData : []);
      } catch (error) {
        console.error(error);
        alert('Erro ao carregar ordens de serviço');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const filteredOS = ordens.filter((os) => {
    const texto = [os.id_os, os.cliente?.nome, os.defeito_relatado, os.aparelho?.marca, os.aparelho?.modelo]
      .join(' ')
      .toLowerCase();
    const matchesSearch = texto.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todas' || os.status === statusFilter;
    const matchesTecnico = tecnicoFilter === 'todos' || os.tecnico?.id_usuario === tecnicoFilter;
    return matchesSearch && matchesStatus && matchesTecnico;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Ordens de Serviço</h1>
        <p className="text-gray-600">Consulte e acompanhe todas as ordens de serviço</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente, aparelho ou defeito..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os status</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tecnicoFilter} onValueChange={setTecnicoFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por técnico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os técnicos</SelectItem>
                {tecnicos.map((tecnico) => (
                  <SelectItem key={tecnico._id} value={tecnico.id_usuario}>{tecnico.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-12 text-center"><p className="text-gray-500">Carregando ordens de serviço...</p></CardContent></Card>
      ) : filteredOS.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><p className="text-gray-500">Nenhuma ordem encontrada</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredOS.map((os) => (
            <Link key={os._id} to={`/ordem-servico/${os._id}`}>
              <Card className="hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-medium">OS #{os.id_os}</span>
                        <Badge className={statusColors[os.status] || 'bg-gray-100 text-gray-800'}>
                          {statusLabels[os.status] || os.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-900"><strong>Cliente:</strong> {os.cliente?.nome || 'N/A'}</p>
                        <p className="text-gray-900"><strong>Aparelho:</strong> {os.aparelho?.marca || 'N/A'} {os.aparelho?.modelo || ''}</p>
                        <p className="text-gray-600"><strong>Defeito:</strong> {os.defeito_relatado || 'Não informado'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-600 md:text-right">
                      <div className="flex items-center gap-2 md:justify-end"><Calendar className="h-4 w-4" /><span>Entrada: {os.createdAt ? new Date(os.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</span></div>
                      <div className="flex items-center gap-2 md:justify-end"><User className="h-4 w-4" /><span>{os.tecnico?.nome || 'Sem técnico'}</span></div>
                      <div className="flex items-center gap-2 md:justify-end"><Calendar className="h-4 w-4" /><span>Previsão: {os.prazo_estimado ? new Date(os.prazo_estimado).toLocaleDateString('pt-BR') : 'Não informada'}</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

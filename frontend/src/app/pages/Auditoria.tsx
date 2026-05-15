import { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { apiRequest } from '../services/api';
import { Search } from 'lucide-react';

interface AuditoriaItem {
  _id: string;
  acao: string;
  entidade: string;
  entidade_codigo?: string;
  descricao?: string;
  usuario?: {
    nome?: string;
    perfis?: string[];
  };
  metadata?: Record<string, any>;
  createdAt?: string;
}

const formatarData = (data?: string) => {
  if (!data) return 'N/A';
  return new Date(data).toLocaleString('pt-BR');
};

export function Auditoria() {
  const [registros, setRegistros] = useState<AuditoriaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/auditoria?limit=200');
        setRegistros(Array.isArray(data) ? data : []);
      } catch (error: any) {
        alert(error.message || 'Erro ao carregar auditoria');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const filtrados = registros.filter((item) => {
    const texto = [
      item.acao,
      item.entidade,
      item.entidade_codigo,
      item.descricao,
      item.usuario?.nome,
      ...(item.usuario?.perfis || []),
    ].join(' ').toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Auditoria</h1>
        <p className="text-gray-600">Rastro digital de ações, perfis, datas e horários do sistema</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por usuário, ação, perfil, OS, cliente ou estoque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-gray-500">Carregando auditoria...</CardContent></Card>
      ) : filtrados.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">Nenhum registro encontrado</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((item) => (
            <Card key={item._id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">{item.acao}</Badge>
                      <Badge className="bg-gray-100 text-gray-800">{item.entidade}</Badge>
                      {item.entidade_codigo && <span className="text-sm text-gray-500">{item.entidade_codigo}</span>}
                    </div>
                    <p className="text-sm text-gray-900">{item.descricao || 'Sem descrição'}</p>
                    <div className="flex flex-wrap gap-2">
                      {(item.usuario?.perfis || []).map((perfil) => (
                        <Badge key={perfil} className="bg-emerald-100 text-emerald-800">{perfil}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 lg:text-right">
                    <p><strong>Usuário:</strong> {item.usuario?.nome || 'Sistema'}</p>
                    <p><strong>Data/hora:</strong> {formatarData(item.createdAt)}</p>
                  </div>
                </div>

                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <pre className="mt-3 overflow-x-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

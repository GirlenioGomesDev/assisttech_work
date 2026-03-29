import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Package, CheckCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import { apiRequest } from '../services/api';

interface OrdemServico {
  _id: string;
  id_os: string;
  status: string;
  cliente?: { nome?: string };
  aparelho?: { marca?: string; modelo?: string };
  entrega?: { data_entrega?: string; observacoes?: string };
}

export function Entregas() {
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
        alert('Erro ao carregar entregas');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const prontas = ordens.filter((os) => os.status === 'pronto');
  const entregues = ordens.filter((os) => os.status === 'entregue');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Entregas</h1>
        <p className="text-gray-600">Gerencie a retirada dos aparelhos pelos clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Prontas para entrega</p><p className="text-3xl mt-2">{loading ? '...' : prontas.length}</p></div><div className="p-3 bg-green-100 rounded-full"><Package className="h-6 w-6 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Já entregues</p><p className="text-3xl mt-2">{loading ? '...' : entregues.length}</p></div><div className="p-3 bg-blue-100 rounded-full"><CheckCircle className="h-6 w-6 text-blue-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Aparelhos prontos para entrega</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-gray-500 py-4 text-center">Carregando...</p> : prontas.length === 0 ? <p className="text-sm text-gray-500 py-4 text-center">Nenhum aparelho pronto para entrega</p> : (
            <div className="space-y-3">
              {prontas.map((os) => (
                <Link key={os._id} to={`/ordem-servico/${os._id}`} className="block p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100/60">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">OS #{os.id_os}</p>
                      <p className="text-sm text-gray-700">Cliente: {os.cliente?.nome || 'Não informado'}</p>
                      <p className="text-sm text-gray-700">Aparelho: {os.aparelho?.marca || '---'} {os.aparelho?.modelo || ''}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Pronto para entregar</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Entregas realizadas</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-gray-500 py-4 text-center">Carregando...</p> : entregues.length === 0 ? <p className="text-sm text-gray-500 py-4 text-center">Nenhuma entrega registrada</p> : (
            <div className="space-y-3">
              {entregues.map((os) => (
                <Link key={os._id} to={`/ordem-servico/${os._id}`} className="block p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">OS #{os.id_os}</p>
                      <p className="text-sm text-gray-700">Cliente: {os.cliente?.nome || 'Não informado'}</p>
                      <p className="text-sm text-gray-700">Aparelho: {os.aparelho?.marca || '---'} {os.aparelho?.modelo || ''}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{os.entrega?.data_entrega ? new Date(os.entrega.data_entrega).toLocaleString('pt-BR') : 'Data não informada'}</span>
                    </div>
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

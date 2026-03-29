import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DollarSign, CreditCard, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { apiRequest } from '../services/api';

interface OrdemServico {
  _id: string;
  id_os: string;
  status: string;
  cliente?: { nome?: string };
  pagamento?: {
    valor_bruto?: number;
    desconto?: number;
    valor_final?: number;
    forma_pagamento?: string;
    status_pagamento?: string;
    data_pagamento?: string;
    observacoes?: string;
  };
}

const moeda = (v?: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Pagamentos() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/os');
        setOrdens(Array.isArray(data) ? data.filter((os) => os.pagamento) : []);
      } catch (error) {
        console.error(error);
        alert('Erro ao carregar pagamentos');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const totalRecebido = useMemo(() => ordens.reduce((acc, os) => acc + Number(os.pagamento?.valor_final || 0), 0), [ordens]);
  const pagos = ordens.filter((os) => os.pagamento?.status_pagamento === 'pago').length;
  const pendentes = ordens.filter((os) => os.pagamento?.status_pagamento !== 'pago').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Pagamentos</h1>
        <p className="text-gray-600">Acompanhe os recebimentos registrados nas ordens de serviço</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Total recebido</p><p className="text-2xl mt-2">{loading ? '...' : moeda(totalRecebido)}</p></div><div className="p-3 bg-green-100 rounded-full"><DollarSign className="h-6 w-6 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Pagos</p><p className="text-2xl mt-2">{loading ? '...' : pagos}</p></div><div className="p-3 bg-blue-100 rounded-full"><CreditCard className="h-6 w-6 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Pendentes</p><p className="text-2xl mt-2">{loading ? '...' : pendentes}</p></div><div className="p-3 bg-yellow-100 rounded-full"><Wallet className="h-6 w-6 text-yellow-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500 py-4 text-center">Carregando...</p>
          ) : ordens.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nenhum pagamento registrado ainda</p>
          ) : (
            <div className="space-y-3">
              {ordens.map((os) => (
                <Link key={os._id} to={`/ordem-servico/${os._id}`} className="block p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">OS #{os.id_os}</p>
                      <p className="text-sm text-gray-600">Cliente: {os.cliente?.nome || 'Não informado'}</p>
                      <p className="text-sm text-gray-600">Forma: {os.pagamento?.forma_pagamento || 'Não informada'}</p>
                    </div>
                    <div className="text-sm md:text-right space-y-1">
                      <Badge className={os.pagamento?.status_pagamento === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {os.pagamento?.status_pagamento || 'pendente'}
                      </Badge>
                      <p className="font-medium">{moeda(os.pagamento?.valor_final)}</p>
                      <p className="text-gray-500">{os.pagamento?.data_pagamento ? new Date(os.pagamento.data_pagamento).toLocaleString('pt-BR') : 'Sem data'}</p>
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

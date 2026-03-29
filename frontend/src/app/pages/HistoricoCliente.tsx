import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Smartphone, FileText, DollarSign } from 'lucide-react';
import { apiRequest } from '../services/api';

interface Cliente {
  _id: string;
  id_cliente: string;
  nome: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  cpf?: string;
}

interface OrdemServico {
  _id: string;
  id_os: string;
  status: string;
  cliente?: { id_cliente?: string; nome?: string };
  aparelho?: { marca?: string; modelo?: string; tipo_aparelho?: string; cor?: string };
  defeito_relatado?: string;
  orcamento?: { valor_total?: number };
}

const statusLabel: Record<string, string> = {
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

export function HistoricoCliente() {
  const { id } = useParams();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const [clientesData, osData] = await Promise.all([apiRequest('/clientes'), apiRequest('/os')]);
        const encontrado = (clientesData || []).find((c: Cliente) => c._id === id);
        setCliente(encontrado || null);
        setOrdens((osData || []).filter((os: OrdemServico) => os.cliente?.id_cliente === encontrado?.id_cliente));
      } catch (error) {
        console.error(error);
        alert('Erro ao carregar histórico do cliente');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [id]);

  const totalGasto = useMemo(() => ordens.reduce((sum, os) => sum + Number(os.orcamento?.valor_total || 0), 0), [ordens]);

  if (loading) return <Card><CardContent className="p-10 text-center text-gray-500">Carregando histórico...</CardContent></Card>;
  if (!cliente) return <Card><CardContent className="p-10 text-center text-gray-500">Cliente não encontrado</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/clientes"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl text-gray-900">Histórico do cliente</h1>
          <p className="text-gray-600">{cliente.nome}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Ordens de serviço</p><p className="text-3xl mt-2">{ordens.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Aparelhos registrados</p><p className="text-3xl mt-2">{ordens.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-600">Total em orçamentos</p><p className="text-3xl mt-2">{Number(totalGasto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do cliente</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p><strong>Telefone:</strong> {cliente.telefone || cliente.whatsapp || 'Não informado'}</p>
          <p><strong>E-mail:</strong> {cliente.email || 'Não informado'}</p>
          <p><strong>CPF:</strong> {cliente.cpf || 'Não informado'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ordens e aparelhos</CardTitle></CardHeader>
        <CardContent>
          {ordens.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma ordem de serviço encontrada para este cliente.</p>
          ) : (
            <div className="space-y-3">
              {ordens.map((os) => (
                <Link key={os._id} to={`/ordem-servico/${os._id}`} className="block p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900 flex items-center gap-2"><FileText className="h-4 w-4" />OS #{os.id_os}</p>
                      <p className="text-sm text-gray-700 flex items-center gap-2"><Smartphone className="h-4 w-4" />{os.aparelho?.marca || '---'} {os.aparelho?.modelo || ''} - {os.aparelho?.tipo_aparelho || 'sem tipo'}</p>
                      <p className="text-sm text-gray-600">Defeito: {os.defeito_relatado || 'Não informado'}</p>
                    </div>
                    <div className="text-sm md:text-right space-y-1">
                      <p className="font-medium">{statusLabel[os.status] || os.status}</p>
                      <p className="text-gray-600 flex items-center md:justify-end gap-1"><DollarSign className="h-4 w-4" />{Number(os.orcamento?.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
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

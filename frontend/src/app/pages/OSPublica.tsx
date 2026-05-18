import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Clock, ShieldCheck, Wrench } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface OSPublicaData {
  id_os: string;
  status?: string;
  prazo_estimado?: string;
  cliente?: { nome?: string };
  aparelho?: { tipo_aparelho?: string; marca?: string; modelo?: string };
  diagnostico?: { defeito_identificado?: string };
  orcamento?: { valor_total?: number; status_aprovacao?: string };
  garantia?: { fim?: string };
  eventos?: Array<{ tipo?: string; titulo?: string; descricao?: string; data?: string }>;
}

interface ConfigPublica {
  empresa?: {
    nome?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    logo_base64?: string;
  };
  operacional?: {
    horario_atendimento?: string;
  };
}

const moeda = (valor?: number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarData = (data?: string) => {
  if (!data) return 'Nao informado';
  const value = new Date(data);
  return Number.isNaN(value.getTime()) ? 'Nao informado' : value.toLocaleDateString('pt-BR');
};

export function OSPublica() {
  const { codigo } = useParams();
  const [os, setOs] = useState<OSPublicaData | null>(null);
  const [config, setConfig] = useState<ConfigPublica>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const [osResponse, configResponse] = await Promise.all([
          fetch(`${API_URL}/os/publica/${codigo}`),
          fetch(`${API_URL}/configuracoes/publica`),
        ]);
        const data = await osResponse.json().catch(() => ({}));
        const configData = await configResponse.json().catch(() => ({}));
        if (configResponse.ok) setConfig(configData);
        if (!osResponse.ok) throw new Error(data.erro || 'OS nao encontrada');
        setOs(data);
      } catch (error: any) {
        setErro(error.message || 'Erro ao carregar OS');
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [codigo]);

  if (loading) return <div className="min-h-screen bg-gray-50 p-6"><Card><CardContent className="p-10 text-center text-gray-500">Carregando acompanhamento...</CardContent></Card></div>;
  if (erro || !os) return <div className="min-h-screen bg-gray-50 p-6"><Card><CardContent className="p-10 text-center text-gray-500">{erro || 'OS nao encontrada'}</CardContent></Card></div>;

  const eventos = [...(os.eventos || [])].reverse().slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900 md:p-8">
      <main className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-3 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              {config.empresa?.logo_base64 && <img src={config.empresa.logo_base64} alt="Logo" className="h-12 max-w-28 object-contain" />}
              <div>
                <h1 className="text-2xl font-semibold">{config.empresa?.nome || 'AssistTech'}</h1>
                <p className="text-sm text-gray-600">Acompanhamento da ordem de servico</p>
              </div>
            </div>
          </div>
          <Badge className="w-fit bg-blue-100 text-blue-800">OS {os.id_os}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Status atual</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-xl font-medium">{os.status || 'aberta'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Previsao</p>
              <p className="text-xl font-medium">{formatarData(os.prazo_estimado)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Aparelho</p>
              <p className="font-medium">{os.aparelho?.marca || '---'} {os.aparelho?.modelo || ''}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Orcamento</p>
              <p className="font-medium">{moeda(os.orcamento?.valor_total)} ({os.orcamento?.status_aprovacao || 'pendente'})</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {eventos.length ? eventos.map((evento, index) => (
              <div key={`${evento.titulo}-${index}`} className="rounded-md border p-3">
                <p className="font-medium">{evento.titulo || 'Evento'}</p>
                {evento.descricao && <p className="text-sm text-gray-600">{evento.descricao}</p>}
                <p className="mt-1 text-xs text-gray-500">{formatarData(evento.data)}</p>
              </div>
            )) : <p className="text-sm text-gray-500">Nenhuma atualizacao publicada ainda.</p>}
          </CardContent>
        </Card>

        {os.garantia?.fim && (
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="text-sm">Garantia registrada ate {formatarData(os.garantia.fim)}.</p>
            </CardContent>
          </Card>
        )}

        {(config.empresa?.whatsapp || config.empresa?.telefone || config.empresa?.email || config.operacional?.horario_atendimento) && (
          <p className="text-center text-xs text-gray-500">
            {[config.empresa?.whatsapp || config.empresa?.telefone, config.empresa?.email, config.operacional?.horario_atendimento].filter(Boolean).join(' | ')}
          </p>
        )}
      </main>
    </div>
  );
}

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

const metadataLabels: Record<string, string> = {
  aparelho: 'Aparelho',
  cliente: 'Cliente',
  data_entrega: 'Data da entrega',
  defeito_identificado: 'Defeito identificado',
  descricao_servico: 'Serviço executado',
  forma_pagamento: 'Forma de pagamento',
  fotos: 'Fotos',
  pecas_trocadas: 'Peças trocadas',
  quantidade: 'Quantidade',
  recebedor_nome: 'Recebedor',
  solucao_recomendada: 'Solução recomendada',
  status: 'Status',
  status_aprovacao: 'Status da aprovação',
  status_pagamento: 'Status do pagamento',
  tecnico: 'Técnico',
  valor_final: 'Valor final',
  valor_mao_obra: 'Valor da mão de obra',
  valor_pecas: 'Valor das peças',
  valor_total: 'Valor total',
  valor_unitario: 'Valor unitário',
};

const currencyFields = new Set([
  'valor_final',
  'valor_mao_obra',
  'valor_pecas',
  'valor_total',
  'valor_unitario',
]);

const formatarCampo = (campo: string) =>
  metadataLabels[campo] ||
  campo
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letra) => letra.toUpperCase());

const formatarValorMetadata = (campo: string, valor: any) => {
  if (valor === null || valor === undefined || valor === '') return 'Não informado';

  if (currencyFields.has(campo)) {
    const numero = Number(valor);
    if (!Number.isNaN(numero)) {
      return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
  }

  if (campo.includes('data')) {
    const data = new Date(valor);
    if (!Number.isNaN(data.getTime())) return data.toLocaleString('pt-BR');
  }

  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  if (Array.isArray(valor)) return valor.length ? valor.join(', ') : 'Nenhum';
  if (typeof valor === 'object') return Object.values(valor).filter(Boolean).join(' - ') || 'Não informado';

  return String(valor);
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
                  <div className="mt-3 grid gap-2 rounded-md bg-gray-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(item.metadata).map(([campo, valor]) => (
                      <div key={campo} className="min-w-0">
                        <p className="text-xs font-medium text-gray-500">{formatarCampo(campo)}</p>
                        <p className="break-words text-sm text-gray-800">{formatarValorMetadata(campo, valor)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

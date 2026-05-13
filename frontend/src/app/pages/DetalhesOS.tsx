import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, User, Calendar, AlertCircle, DollarSign, Wrench, Clock, Save, CheckCircle, Package } from 'lucide-react';
import { apiRequest } from '../services/api';
import { formatCpf, formatPhone, onlyDigits } from '../utils/onlyDigits';

const statusOptions = [
  { value: 'aberta', label: 'Aberta', color: 'bg-blue-100 text-blue-800' },
  { value: 'em_diagnostico', label: 'Em diagnóstico', color: 'bg-purple-100 text-purple-800' },
  { value: 'aguardando_aprovacao', label: 'Aguardando aprovação', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'aprovado', label: 'Aprovado', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'rejeitado', label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  { value: 'em_reparo', label: 'Em reparo', color: 'bg-orange-100 text-orange-800' },
  { value: 'aguardando_peca', label: 'Aguardando peça', color: 'bg-pink-100 text-pink-800' },
  { value: 'pronto', label: 'Pronto', color: 'bg-green-100 text-green-800' },
  { value: 'entregue', label: 'Entregue', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-zinc-100 text-zinc-800' },
];

interface OrdemServico {
  _id: string;
  id_os: string;
  status?: string;
  prioridade?: string;
  defeito_relatado?: string;
  prazo_estimado?: string;
  observacoes_gerais?: string;
  createdAt?: string;
  data_entrega?: string;
  cliente?: { nome?: string; telefone?: string; whatsapp?: string; email?: string };
  tecnico?: { nome?: string };
  aparelho?: {
    tipo_aparelho?: string;
    marca?: string;
    modelo?: string;
    cor?: string;
    imei_ou_serial?: string;
    acessorios_entregues?: string;
    senha_informada?: string;
    estado_fisico?: string;
    defeito_relatado_inicial?: string;
  };
  diagnostico?: {
    defeito_identificado?: string;
    causa_provavel?: string;
    solucao_recomendada?: string;
    observacoes_tecnicas?: string;
    testes_realizados?: string[];
    pecas_necessarias?: string[];
    data_diagnostico?: string;
  };
  orcamento?: {
    valor_mao_obra?: number;
    valor_pecas?: number;
    valor_total?: number;
    status_aprovacao?: string;
    data_orcamento?: string;
    data_aprovacao?: string;
    observacao_aprovacao?: string;
  };
  servico_executado?: {
    descricao_servico?: string;
    pecas_trocadas?: string;
    testes_finais?: string;
    observacoes?: string;
    data_conclusao?: string;
  };
  pagamento?: {
    valor_bruto?: number;
    desconto?: number;
    valor_final?: number;
    forma_pagamento?: string;
    status_pagamento?: string;
    data_pagamento?: string;
    observacoes?: string;
  };
  entrega?: {
    recebedor_nome?: string;
    recebedor_documento?: string;
    observacoes?: string;
    data_entrega?: string;
  };
  logs?: Array<{ acao?: string; usuario?: string; data?: string }>;
  historico_status?: Array<{ status?: string; usuario?: string; data?: string }>;
}

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export function DetalhesOS() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const [os, setOs] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [diagnostico, setDiagnostico] = useState({
    defeito_identificado: '',
    causa_provavel: '',
    solucao_recomendada: '',
    observacoes_tecnicas: '',
    testes_realizados: '',
    pecas_necessarias: '',
  });

  const [orcamento, setOrcamento] = useState({
    valor_mao_obra: '0',
    valor_pecas: '0',
    status_aprovacao: 'pendente',
    observacao_aprovacao: '',
  });

  const [servico, setServico] = useState({
    descricao_servico: '',
    pecas_trocadas: '',
    testes_finais: '',
    observacoes: '',
    data_conclusao: '',
  });

  const [pagamento, setPagamento] = useState({
    valor_bruto: '0',
    desconto: '0',
    forma_pagamento: 'pix',
    status_pagamento: 'pendente',
    data_pagamento: '',
    observacoes: '',
  });

  const [entrega, setEntrega] = useState({
    recebedor_nome: '',
    recebedor_documento: '',
    observacoes: '',
    data_entrega: '',
  });

  useEffect(() => {
    if (id) carregarOS();
  }, [id]);

  const carregarOS = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/os/${id}`);
      setOs(data);
      setDiagnostico({
        defeito_identificado: data.diagnostico?.defeito_identificado || '',
        causa_provavel: data.diagnostico?.causa_provavel || '',
        solucao_recomendada: data.diagnostico?.solucao_recomendada || '',
        observacoes_tecnicas: data.diagnostico?.observacoes_tecnicas || '',
        testes_realizados: (data.diagnostico?.testes_realizados || []).join(', '),
        pecas_necessarias: (data.diagnostico?.pecas_necessarias || []).join(', '),
      });
      setOrcamento({
        valor_mao_obra: String(data.orcamento?.valor_mao_obra || 0),
        valor_pecas: String(data.orcamento?.valor_pecas || 0),
        status_aprovacao: data.orcamento?.status_aprovacao || 'pendente',
        observacao_aprovacao: data.orcamento?.observacao_aprovacao || '',
      });
      setServico({
        descricao_servico: data.servico_executado?.descricao_servico || '',
        pecas_trocadas: data.servico_executado?.pecas_trocadas || '',
        testes_finais: data.servico_executado?.testes_finais || '',
        observacoes: data.servico_executado?.observacoes || '',
        data_conclusao: data.servico_executado?.data_conclusao ? new Date(data.servico_executado.data_conclusao).toISOString().slice(0, 16) : '',
      });
      setPagamento({
        valor_bruto: String(data.pagamento?.valor_bruto || data.orcamento?.valor_total || 0),
        desconto: String(data.pagamento?.desconto || 0),
        forma_pagamento: data.pagamento?.forma_pagamento || 'pix',
        status_pagamento: data.pagamento?.status_pagamento || 'pendente',
        data_pagamento: data.pagamento?.data_pagamento ? new Date(data.pagamento.data_pagamento).toISOString().slice(0, 16) : '',
        observacoes: data.pagamento?.observacoes || '',
      });
      setEntrega({
        recebedor_nome: data.entrega?.recebedor_nome || '',
        recebedor_documento: data.entrega?.recebedor_documento || '',
        observacoes: data.entrega?.observacoes || '',
        data_entrega: data.entrega?.data_entrega ? new Date(data.entrega.data_entrega).toISOString().slice(0, 16) : '',
      });
    } catch (error) {
      console.error(error);
      setOs(null);
    } finally {
      setLoading(false);
    }
  };

  const canDiagnosticar = ['admin', 'tecnico'].includes(user?.perfil);
  const canAprovar = ['admin', 'atendente'].includes(user?.perfil);
  const canFinanceiro = ['admin', 'financeiro'].includes(user?.perfil);
  const canEntregar = ['admin', 'atendente'].includes(user?.perfil);
  const canAlterarStatus = ['admin', 'tecnico', 'atendente'].includes(user?.perfil);

  const formatarData = (data?: string) => {
    if (!data) return 'Não informado';
    const d = new Date(data);
    return Number.isNaN(d.getTime()) ? 'Não informado' : d.toLocaleString('pt-BR');
  };

  const moeda = (valor?: number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statusAtual = useMemo(
    () => statusOptions.find((item) => item.value === os?.status) || statusOptions[0],
    [os?.status]
  );

  const withSave = async (fn: () => Promise<void>, successMessage: string) => {
    try {
      setSaving(true);
      await fn();
      alert(successMessage);
      await carregarOS();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const salvarDiagnostico = () => withSave(async () => {
    await apiRequest(`/os/${id}/diagnostico`, {
      method: 'PATCH',
      body: JSON.stringify({
        defeito_identificado: diagnostico.defeito_identificado,
        causa_provavel: diagnostico.causa_provavel,
        solucao_recomendada: diagnostico.solucao_recomendada,
        observacoes_tecnicas: diagnostico.observacoes_tecnicas,
        testes_realizados: diagnostico.testes_realizados.split(',').map((item) => item.trim()).filter(Boolean),
        pecas_necessarias: diagnostico.pecas_necessarias.split(',').map((item) => item.trim()).filter(Boolean),
        data_diagnostico: new Date().toISOString(),
      }),
    });
  }, 'Diagnóstico salvo com sucesso');

  const salvarOrcamento = () => withSave(async () => {
    await apiRequest(`/os/${id}/orcamento`, {
      method: 'PATCH',
      body: JSON.stringify({
        valor_mao_obra: Number(orcamento.valor_mao_obra || 0),
        valor_pecas: Number(orcamento.valor_pecas || 0),
        status_aprovacao: orcamento.status_aprovacao,
        observacao_aprovacao: orcamento.observacao_aprovacao,
        data_orcamento: new Date().toISOString(),
      }),
    });
  }, 'Orçamento salvo com sucesso');

  const aprovarOrcamento = (status: 'aprovado' | 'rejeitado') => withSave(async () => {
    await apiRequest(`/os/${id}/orcamento/aprovacao`, {
      method: 'PATCH',
      body: JSON.stringify({
        status_aprovacao: status,
        observacao_aprovacao: orcamento.observacao_aprovacao,
      }),
    });
    await apiRequest(`/os/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, usuario: user?.nome || 'Sistema' }),
    });
  }, `Orçamento ${status === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso`);

  const salvarServico = () => withSave(async () => {
    await apiRequest(`/os/${id}/servico`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...servico,
        data_conclusao: servico.data_conclusao || new Date().toISOString(),
      }),
    });
  }, 'Serviço executado salvo com sucesso');

  const salvarPagamento = () => withSave(async () => {
    await apiRequest(`/os/${id}/pagamento`, {
      method: 'PATCH',
      body: JSON.stringify({
        valor_bruto: Number(pagamento.valor_bruto || 0),
        desconto: Number(pagamento.desconto || 0),
        forma_pagamento: pagamento.forma_pagamento,
        status_pagamento: pagamento.status_pagamento,
        data_pagamento: pagamento.data_pagamento || new Date().toISOString(),
        observacoes: pagamento.observacoes,
      }),
    });
  }, 'Pagamento salvo com sucesso');

  const salvarEntrega = () => withSave(async () => {
    await apiRequest(`/os/${id}/entrega`, {
      method: 'PATCH',
      body: JSON.stringify({
        recebedor_nome: entrega.recebedor_nome,
        recebedor_documento: entrega.recebedor_documento,
        observacoes: entrega.observacoes,
        data_entrega: entrega.data_entrega || new Date().toISOString(),
      }),
    });
  }, 'Entrega registrada com sucesso');

  const atualizarStatus = (status: string) => withSave(async () => {
    await apiRequest(`/os/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, usuario: user?.nome || 'Sistema' }),
    });
  }, 'Status atualizado com sucesso');

  if (loading) return <Card><CardContent className="p-12 text-center text-gray-500">Carregando ordem de serviço...</CardContent></Card>;
  if (!os) return <Card><CardContent className="p-12 text-center text-gray-500">Ordem de serviço não encontrada</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/ordens-servico')}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl text-gray-900">OS #{os.id_os}</h1>
            <Badge className={statusAtual.color}>{statusAtual.label}</Badge>
          </div>
          <p className="text-gray-600 mt-1">Detalhes completos da ordem de serviço</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
              <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
              <TabsTrigger value="execucao">Execução</TabsTrigger>
              <TabsTrigger value="finalizacao">Finalização</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Informações do Cliente</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Nome:</strong> {os.cliente?.nome || 'Não informado'}</p>
                  <p><strong>Telefone:</strong> {formatPhone(os.cliente?.telefone || os.cliente?.whatsapp || '') || 'Não informado'}</p>
                  <p><strong>E-mail:</strong> {os.cliente?.email || 'Não informado'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Informações do Aparelho</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Tipo:</strong> {os.aparelho?.tipo_aparelho || 'Não informado'}</p>
                  <p><strong>Marca / Modelo:</strong> {os.aparelho?.marca || '---'} {os.aparelho?.modelo || ''}</p>
                  <p><strong>Cor:</strong> {os.aparelho?.cor || 'Não informada'}</p>
                  <p><strong>IMEI / Serial:</strong> {os.aparelho?.imei_ou_serial || 'Não informado'}</p>
                  <p><strong>Acessórios:</strong> {os.aparelho?.acessorios_entregues || 'Nenhum informado'}</p>
                  <p><strong>Estado físico:</strong> {os.aparelho?.estado_fisico || 'Não informado'}</p>
                  {os.aparelho?.senha_informada && <p><strong>Senha:</strong> {os.aparelho.senha_informada}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Defeito relatado</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{os.defeito_relatado || 'Não informado'}</p>
                  {os.aparelho?.defeito_relatado_inicial && <p><strong>Defeito inicial:</strong> {os.aparelho.defeito_relatado_inicial}</p>}
                  {os.observacoes_gerais && <p><strong>Observações:</strong> {os.observacoes_gerais}</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="diagnostico" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Diagnóstico técnico</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Defeito identificado</Label><Textarea value={diagnostico.defeito_identificado} onChange={(e) => setDiagnostico({ ...diagnostico, defeito_identificado: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Causa provável</Label><Textarea value={diagnostico.causa_provavel} onChange={(e) => setDiagnostico({ ...diagnostico, causa_provavel: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Solução recomendada</Label><Textarea value={diagnostico.solucao_recomendada} onChange={(e) => setDiagnostico({ ...diagnostico, solucao_recomendada: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Testes realizados</Label><Input value={diagnostico.testes_realizados} onChange={(e) => setDiagnostico({ ...diagnostico, testes_realizados: e.target.value })} placeholder="Separe por vírgula" disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Peças necessárias</Label><Input value={diagnostico.pecas_necessarias} onChange={(e) => setDiagnostico({ ...diagnostico, pecas_necessarias: e.target.value })} placeholder="Separe por vírgula" disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Observações técnicas</Label><Textarea value={diagnostico.observacoes_tecnicas} onChange={(e) => setDiagnostico({ ...diagnostico, observacoes_tecnicas: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  {canDiagnosticar ? <Button onClick={salvarDiagnostico} disabled={saving}><Save className="h-4 w-4 mr-2" />Salvar diagnóstico</Button> : <p className="text-sm text-gray-500">Somente técnico ou administrador podem editar o diagnóstico.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orcamento" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Orçamento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Valor mão de obra</Label><Input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={orcamento.valor_mao_obra} onChange={(e) => setOrcamento({ ...orcamento, valor_mao_obra: onlyDigits(e.target.value) })} disabled={!canDiagnosticar || saving} /></div>
                    <div className="space-y-2"><Label>Valor de peças</Label><Input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={orcamento.valor_pecas} onChange={(e) => setOrcamento({ ...orcamento, valor_pecas: onlyDigits(e.target.value) })} disabled={!canDiagnosticar || saving} /></div>
                  </div>
                  <div className="space-y-2"><Label>Status da aprovação</Label><Select value={orcamento.status_aprovacao} onValueChange={(value) => setOrcamento({ ...orcamento, status_aprovacao: value })} disabled={!canAprovar || saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Observação da aprovação</Label><Textarea value={orcamento.observacao_aprovacao} onChange={(e) => setOrcamento({ ...orcamento, observacao_aprovacao: e.target.value })} disabled={!(canAprovar || canDiagnosticar) || saving} /></div>
                  <div className="rounded-lg border p-4 bg-gray-50"><p className="text-sm text-gray-600">Total estimado</p><p className="text-xl font-medium">{moeda(Number(orcamento.valor_mao_obra || 0) + Number(orcamento.valor_pecas || 0))}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {canDiagnosticar && <Button onClick={salvarOrcamento} disabled={saving}><DollarSign className="h-4 w-4 mr-2" />Salvar orçamento</Button>}
                    {canAprovar && <><Button variant="outline" onClick={() => aprovarOrcamento('aprovado')} disabled={saving}><CheckCircle className="h-4 w-4 mr-2" />Aprovar</Button><Button variant="outline" onClick={() => aprovarOrcamento('rejeitado')} disabled={saving}>Rejeitar</Button></>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="execucao" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Execução do serviço</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Descrição do serviço</Label><Textarea value={servico.descricao_servico} onChange={(e) => setServico({ ...servico, descricao_servico: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Peças trocadas</Label><Input value={servico.pecas_trocadas} onChange={(e) => setServico({ ...servico, pecas_trocadas: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Testes finais</Label><Textarea value={servico.testes_finais} onChange={(e) => setServico({ ...servico, testes_finais: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Observações</Label><Textarea value={servico.observacoes} onChange={(e) => setServico({ ...servico, observacoes: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  <div className="space-y-2"><Label>Data de conclusão</Label><Input type="datetime-local" value={servico.data_conclusao} onChange={(e) => setServico({ ...servico, data_conclusao: e.target.value })} disabled={!canDiagnosticar || saving} /></div>
                  {canDiagnosticar ? <Button onClick={salvarServico} disabled={saving}><Wrench className="h-4 w-4 mr-2" />Salvar execução</Button> : <p className="text-sm text-gray-500">Somente técnico ou administrador podem editar esta etapa.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finalizacao" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Valor bruto</Label><Input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={pagamento.valor_bruto} onChange={(e) => setPagamento({ ...pagamento, valor_bruto: onlyDigits(e.target.value) })} disabled={!canFinanceiro || saving} /></div>
                    <div className="space-y-2"><Label>Desconto</Label><Input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={pagamento.desconto} onChange={(e) => setPagamento({ ...pagamento, desconto: onlyDigits(e.target.value) })} disabled={!canFinanceiro || saving} /></div>
                    <div className="space-y-2"><Label>Forma de pagamento</Label><Select value={pagamento.forma_pagamento} onValueChange={(value) => setPagamento({ ...pagamento, forma_pagamento: value })} disabled={!canFinanceiro || saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="boleto">Boleto</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Status do pagamento</Label><Select value={pagamento.status_pagamento} onValueChange={(value) => setPagamento({ ...pagamento, status_pagamento: value })} disabled={!canFinanceiro || saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="pago">Pago</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2 md:col-span-2"><Label>Data do pagamento</Label><Input type="datetime-local" value={pagamento.data_pagamento} onChange={(e) => setPagamento({ ...pagamento, data_pagamento: e.target.value })} disabled={!canFinanceiro || saving} /></div>
                  </div>
                  <div className="space-y-2"><Label>Observações</Label><Textarea value={pagamento.observacoes} onChange={(e) => setPagamento({ ...pagamento, observacoes: e.target.value })} disabled={!canFinanceiro || saving} /></div>
                  {canFinanceiro && <Button onClick={salvarPagamento} disabled={saving}><DollarSign className="h-4 w-4 mr-2" />Salvar pagamento</Button>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Recebedor</Label><Input value={entrega.recebedor_nome} onChange={(e) => setEntrega({ ...entrega, recebedor_nome: e.target.value })} disabled={!canEntregar || saving} /></div>
                    <div className="space-y-2"><Label>Documento</Label><Input value={formatCpf(entrega.recebedor_documento)} inputMode="numeric" maxLength={14} onChange={(e) => setEntrega({ ...entrega, recebedor_documento: onlyDigits(e.target.value) })} disabled={!canEntregar || saving} /></div>
                    <div className="space-y-2 md:col-span-2"><Label>Data da entrega</Label><Input type="datetime-local" value={entrega.data_entrega} onChange={(e) => setEntrega({ ...entrega, data_entrega: e.target.value })} disabled={!canEntregar || saving} /></div>
                  </div>
                  <div className="space-y-2"><Label>Observações</Label><Textarea value={entrega.observacoes} onChange={(e) => setEntrega({ ...entrega, observacoes: e.target.value })} disabled={!canEntregar || saving} /></div>
                  {canEntregar && <Button onClick={salvarEntrega} disabled={saving}><Package className="h-4 w-4 mr-2" />Confirmar entrega</Button>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4" /><div><p className="text-xs text-gray-500">Entrada</p><p className="text-gray-900">{formatarData(os.createdAt)}</p></div></div>
              <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4" /><div><p className="text-xs text-gray-500">Previsão</p><p className="text-gray-900">{formatarData(os.prazo_estimado)}</p></div></div>
              <div className="flex items-center gap-2 text-gray-600"><User className="h-4 w-4" /><div><p className="text-xs text-gray-500">Técnico</p><p className="text-gray-900">{os.tecnico?.nome || 'Não informado'}</p></div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Alterar status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {canAlterarStatus ? statusOptions.map((item) => (
                <Button key={item.value} type="button" variant={os.status === item.value ? 'default' : 'outline'} className="w-full justify-start" onClick={() => atualizarStatus(item.value)} disabled={saving || os.status === item.value}>{item.label}</Button>
              )) : <p className="text-sm text-gray-500">Seu perfil não pode alterar o status.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Diagnóstico:</strong> {os.diagnostico?.defeito_identificado || 'Pendente'}</p>
              <p><strong>Orçamento:</strong> {moeda(os.orcamento?.valor_total)}</p>
              <p><strong>Aprovação:</strong> {os.orcamento?.status_aprovacao || 'pendente'}</p>
              <p><strong>Pagamento:</strong> {os.pagamento?.status_pagamento || 'pendente'}</p>
              <p><strong>Entrega:</strong> {os.entrega?.data_entrega ? 'Registrada' : 'Pendente'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {os.logs && os.logs.length > 0 ? os.logs.map((item, index) => (
                  <div key={index} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <p className="text-xs text-gray-500">{formatarData(item.data)}</p>
                    <p className="text-sm text-gray-900 mt-1">{item.acao || 'Sem descrição'}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.usuario || 'Sistema'}</p>
                  </div>
                )) : os.historico_status?.map((item, index) => (
                  <div key={index} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <p className="text-xs text-gray-500">{formatarData(item.data)}</p>
                    <p className="text-sm text-gray-900 mt-1">Status alterado para {item.status || '---'}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.usuario || 'Sistema'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

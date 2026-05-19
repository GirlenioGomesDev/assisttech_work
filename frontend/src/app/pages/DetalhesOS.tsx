// Tela completa de acompanhamento de uma ordem de servico.
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, User, Calendar, DollarSign, Wrench, Clock, Save, CheckCircle, Package, Edit, Trash2, FileImage, Video, MessageCircle, ShieldCheck, RotateCcw, Printer, QrCode } from 'lucide-react';
import { apiRequest } from '../services/api';
import { formatCpf, formatPhone, onlyDigits } from '../utils/onlyDigits';
import { AttachmentData, AttachmentInput } from '../components/AttachmentInput';

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

const checklistEntradaPadrao = [
  { chave: 'fotos_entrada', label: 'Fotos do aparelho registradas', checked: false },
  { chave: 'imei_serial', label: 'IMEI ou serial conferido', checked: false },
  { chave: 'acessorios', label: 'Acessorios conferidos', checked: false },
  { chave: 'estado_fisico', label: 'Estado fisico documentado', checked: false },
  { chave: 'senha_autorizacao', label: 'Senha/autorizacao registrada quando necessario', checked: false },
];

const checklistSaidaPadrao = [
  { chave: 'testes_finais', label: 'Testes finais realizados', checked: false },
  { chave: 'limpeza', label: 'Aparelho limpo e revisado', checked: false },
  { chave: 'pagamento', label: 'Pagamento conferido', checked: false },
  { chave: 'garantia', label: 'Garantia explicada ao cliente', checked: false },
  { chave: 'assinatura_entrega', label: 'Entrega/retirada confirmada', checked: false },
];

interface ChecklistItem {
  chave: string;
  label: string;
  checked: boolean;
  observacao?: string;
}

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
  anexos?: Array<{ id_anexo?: string; nome?: string; tipo?: string; tamanho?: number; conteudo?: string; criadoEm?: string }>;
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
    anexos_avaliacao?: AttachmentData[];
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
    anexos_servico?: AttachmentData[];
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
  checklists?: {
    entrada?: ChecklistItem[];
    saida?: ChecklistItem[];
  };
  garantia?: {
    ativa?: boolean;
    dias?: number;
    inicio?: string;
    fim?: string;
    cobertura?: string;
    observacoes?: string;
  };
  reaberturas?: Array<{ motivo?: string; usuario?: string; data?: string }>;
  eventos?: Array<{ tipo?: string; titulo?: string; descricao?: string; usuario?: string; data?: string; metadata?: Record<string, unknown> }>;
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [relatorioMensagem, setRelatorioMensagem] = useState('');
  const [relatorioTelefone, setRelatorioTelefone] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrInfo, setQrInfo] = useState<{ url: string; qrUrl: string } | null>(null);

  const [diagnostico, setDiagnostico] = useState({
    defeito_identificado: '',
    causa_provavel: '',
    solucao_recomendada: '',
    observacoes_tecnicas: '',
    testes_realizados: '',
    pecas_necessarias: '',
    anexos_avaliacao: [] as AttachmentData[],
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
    anexos_servico: [] as AttachmentData[],
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
  const [checklistEntrada, setChecklistEntrada] = useState<ChecklistItem[]>(checklistEntradaPadrao);
  const [checklistSaida, setChecklistSaida] = useState<ChecklistItem[]>(checklistSaidaPadrao);
  const [garantia, setGarantia] = useState({
    ativa: true,
    dias: '90',
    cobertura: 'Garantia de servico conforme politica da empresa',
    observacoes: '',
  });
  const [motivoReabertura, setMotivoReabertura] = useState('');

  const [dadosOS, setDadosOS] = useState({
    tipo_aparelho: '',
    marca: '',
    modelo: '',
    cor: '',
    imei_ou_serial: '',
    acessorios_entregues: '',
    senha_informada: '',
    estado_fisico: '',
    defeito_relatado: '',
    defeito_relatado_inicial: '',
    prioridade: 'media',
    prazo_estimado: '',
    observacoes_gerais: '',
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
        anexos_avaliacao: data.diagnostico?.anexos_avaliacao || [],
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
        anexos_servico: data.servico_executado?.anexos_servico || [],
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
      setChecklistEntrada(data.checklists?.entrada?.length ? data.checklists.entrada : checklistEntradaPadrao);
      setChecklistSaida(data.checklists?.saida?.length ? data.checklists.saida : checklistSaidaPadrao);
      setGarantia({
        ativa: data.garantia?.ativa ?? true,
        dias: String(data.garantia?.dias || 90),
        cobertura: data.garantia?.cobertura || 'Garantia de servico conforme politica da empresa',
        observacoes: data.garantia?.observacoes || '',
      });
      setDadosOS({
        tipo_aparelho: data.aparelho?.tipo_aparelho || '',
        marca: data.aparelho?.marca || '',
        modelo: data.aparelho?.modelo || '',
        cor: data.aparelho?.cor || '',
        imei_ou_serial: data.aparelho?.imei_ou_serial || '',
        acessorios_entregues: data.aparelho?.acessorios_entregues || '',
        senha_informada: data.aparelho?.senha_informada || '',
        estado_fisico: data.aparelho?.estado_fisico || '',
        defeito_relatado: data.defeito_relatado || '',
        defeito_relatado_inicial: data.aparelho?.defeito_relatado_inicial || '',
        prioridade: data.prioridade || 'media',
        prazo_estimado: data.prazo_estimado ? new Date(data.prazo_estimado).toISOString().slice(0, 10) : '',
        observacoes_gerais: data.observacoes_gerais || '',
      });
    } catch (error) {
      console.error(error);
      setOs(null);
    } finally {
      setLoading(false);
    }
  };

  const userPerfis = user?.perfis?.length ? user.perfis : user ? [user.perfil] : [];
  const hasAnyRole = (...roles: string[]) => userPerfis.some((perfil: string) => roles.includes(perfil));
  const canDiagnosticar = hasAnyRole('admin', 'tecnico');
  const canAprovar = hasAnyRole('admin', 'atendente');
  const canFinanceiro = hasAnyRole('admin', 'financeiro');
  const canEntregar = hasAnyRole('admin', 'atendente');
  const canAlterarStatus = hasAnyRole('admin', 'tecnico', 'atendente');
  const canEditarOS = hasAnyRole('admin', 'atendente');
  const canExcluirOS = hasAnyRole('admin');
  const canEditarOrcamento = hasAnyRole('admin', 'tecnico', 'atendente');
  const canVerOrcamento = canEditarOrcamento;
  const canVerFinalizacao = hasAnyRole('admin', 'financeiro', 'atendente');
  const canVerRelatorio = hasAnyRole('admin', 'tecnico', 'atendente');

  const formatarData = (data?: string) => {
    if (!data) return 'Não informado';
    const d = new Date(data);
    return Number.isNaN(d.getTime()) ? 'Não informado' : d.toLocaleString('pt-BR');
  };

  const moeda = (valor?: number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarTamanho = (bytes?: number) => {
    const valor = Number(bytes || 0);
    if (!valor) return '0 KB';
    if (valor < 1024 * 1024) return `${(valor / 1024).toFixed(1)} KB`;
    return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusAtual = useMemo(
    () => statusOptions.find((item) => item.value === os?.status) || statusOptions[0],
    [os?.status]
  );

  const eventosTimeline = useMemo(() => {
    if (os?.eventos?.length) return [...os.eventos].reverse();
    if (os?.logs?.length) {
      return [...os.logs].reverse().map((log) => ({
        tipo: 'sistema',
        titulo: log.acao || 'Registro',
        descricao: log.acao,
        usuario: log.usuario,
        data: log.data,
      }));
    }
    return (os?.historico_status || []).reverse().map((item) => ({
      tipo: 'status',
      titulo: `Status: ${item.status || '---'}`,
      descricao: `Status alterado para ${item.status || '---'}`,
      usuario: item.usuario,
      data: item.data,
    }));
  }, [os]);

  const progressoChecklist = (items: ChecklistItem[]) => {
    if (!items.length) return 0;
    return Math.round((items.filter((item) => item.checked).length / items.length) * 100);
  };

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
        anexos_avaliacao: diagnostico.anexos_avaliacao,
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

  const enviarAvaliacaoWhatsApp = async () => {
    try {
      setSaving(true);
      const data = await apiRequest(`/os/${id}/whatsapp/avaliacao`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      alert(error.message || 'Erro ao preparar mensagem do WhatsApp');
    } finally {
      setSaving(false);
    }
  };

  const carregarRelatorioWhatsApp = async () => {
    try {
      setSaving(true);
      const data = await apiRequest(`/os/${id}/whatsapp/avaliacao`);
      setRelatorioMensagem(data.mensagem || '');
      setRelatorioTelefone(data.telefone || '');
    } catch (error: any) {
      alert(error.message || 'Erro ao carregar relatório');
    } finally {
      setSaving(false);
    }
  };

  const enviarRelatorioBusiness = async () => {
    try {
      setSaving(true);
      await apiRequest(`/os/${id}/whatsapp/avaliacao/enviar`, { method: 'POST' });
      alert('Relatório enviado pelo WhatsApp Business');
      await carregarOS();
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar pelo WhatsApp Business');
    } finally {
      setSaving(false);
    }
  };

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
        anexos_servico: servico.anexos_servico,
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

  const salvarChecklist = (tipo: 'entrada' | 'saida') => withSave(async () => {
    await apiRequest(`/os/${id}/checklist/${tipo}`, {
      method: 'PATCH',
      body: JSON.stringify({ items: tipo === 'entrada' ? checklistEntrada : checklistSaida }),
    });
  }, `Checklist de ${tipo} salvo com sucesso`);

  const salvarGarantia = () => withSave(async () => {
    await apiRequest(`/os/${id}/garantia`, {
      method: 'PATCH',
      body: JSON.stringify({
        ativa: garantia.ativa,
        dias: Number(garantia.dias || 0),
        cobertura: garantia.cobertura,
        observacoes: garantia.observacoes,
      }),
    });
  }, 'Garantia registrada com sucesso');

  const reabrirOS = () => withSave(async () => {
    await apiRequest(`/os/${id}/reabrir`, {
      method: 'POST',
      body: JSON.stringify({ motivo: motivoReabertura }),
    });
    setMotivoReabertura('');
  }, 'OS reaberta com sucesso');

  const abrirImpressao = () => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/os/${id}/imprimir?token=${encodeURIComponent(token)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const carregarQr = async () => {
    try {
      setSaving(true);
      const data = await apiRequest(`/os/${id}/qr`);
      setQrInfo(data);
      setQrDialogOpen(true);
    } catch (error: any) {
      alert(error.message || 'Erro ao gerar QR Code');
    } finally {
      setSaving(false);
    }
  };

  const atualizarStatus = (status: string) => withSave(async () => {
    await apiRequest(`/os/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, usuario: user?.nome || 'Sistema' }),
    });
  }, 'Status atualizado com sucesso');

  const handleDadosOSChange = (campo: string, valor: string) => {
    setDadosOS((prev) => ({
      ...prev,
      [campo]: campo === 'imei_ou_serial' && prev.tipo_aparelho === 'celular' ? onlyDigits(valor).slice(0, 15) : valor,
    }));
  };

  const handleTipoAparelhoChange = (value: string) => {
    setDadosOS((prev) => ({
      ...prev,
      tipo_aparelho: value,
      imei_ou_serial: value === 'celular' ? onlyDigits(prev.imei_ou_serial).slice(0, 15) : prev.imei_ou_serial,
    }));
  };

  const salvarDadosOS = async (e: React.FormEvent) => {
    e.preventDefault();

    await withSave(async () => {
      await apiRequest(`/os/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          defeito_relatado: dadosOS.defeito_relatado,
          prioridade: dadosOS.prioridade,
          prazo_estimado: dadosOS.prazo_estimado,
          observacoes_gerais: dadosOS.observacoes_gerais,
          aparelho: {
            ...(os?.aparelho || {}),
            tipo_aparelho: dadosOS.tipo_aparelho,
            marca: dadosOS.marca,
            modelo: dadosOS.modelo,
            cor: dadosOS.cor,
            imei_ou_serial:
              dadosOS.tipo_aparelho === 'celular'
                ? onlyDigits(dadosOS.imei_ou_serial).slice(0, 15)
                : dadosOS.imei_ou_serial,
            acessorios_entregues: dadosOS.acessorios_entregues,
            senha_informada: dadosOS.senha_informada,
            estado_fisico: dadosOS.estado_fisico,
            defeito_relatado_inicial: dadosOS.defeito_relatado_inicial,
          },
        }),
      });
      setEditDialogOpen(false);
    }, 'Ordem de serviço atualizada com sucesso');
  };

  const excluirOS = async () => {
    const confirmou = window.confirm(`Tem certeza que deseja apagar a OS #${os?.id_os}?`);
    if (!confirmou) return;

    try {
      setSaving(true);
      await apiRequest(`/os/${id}`, { method: 'DELETE' });
      alert('Ordem de serviço apagada com sucesso!');
      navigate('/ordens-servico');
    } catch (error: any) {
      alert(error.message || 'Erro ao apagar ordem de serviço');
    } finally {
      setSaving(false);
    }
  };

  const renderChecklist = (
    titulo: string,
    items: ChecklistItem[],
    setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>,
    tipo: 'entrada' | 'saida'
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{titulo}</span>
          <Badge className="bg-blue-100 text-blue-800">{progressoChecklist(items)}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.chave} className="rounded-md border p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(checked) => {
                    setItems((current) => current.map((currentItem, currentIndex) => (
                      currentIndex === index ? { ...currentItem, checked: Boolean(checked) } : currentItem
                    )));
                  }}
                  disabled={saving}
                />
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">{item.label}</Label>
                  <Input
                    value={item.observacao || ''}
                    onChange={(event) => {
                      setItems((current) => current.map((currentItem, currentIndex) => (
                        currentIndex === index ? { ...currentItem, observacao: event.target.value } : currentItem
                      )));
                    }}
                    placeholder="Observacao opcional"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={() => salvarChecklist(tipo)} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Salvar checklist
        </Button>
      </CardContent>
    </Card>
  );

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={abrirImpressao} disabled={saving}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={carregarQr} disabled={saving}>
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          {canEditarOS && (
            <Button variant="outline" onClick={() => setEditDialogOpen(true)} disabled={saving}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {canExcluirOS && (
            <Button variant="outline" onClick={excluirOS} disabled={saving}>
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar
            </Button>
          )}
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar ordem de serviço</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={salvarDadosOS}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_tipo_aparelho">Tipo do aparelho *</Label>
                <Select value={dadosOS.tipo_aparelho} onValueChange={handleTipoAparelhoChange}>
                  <SelectTrigger id="edit_tipo_aparelho"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celular">Celular</SelectItem>
                    <SelectItem value="notebook">Notebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_marca">Marca *</Label>
                <Input id="edit_marca" value={dadosOS.marca} onChange={(e) => handleDadosOSChange('marca', e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_modelo">Modelo *</Label>
                <Input id="edit_modelo" value={dadosOS.modelo} onChange={(e) => handleDadosOSChange('modelo', e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_cor">Cor</Label>
                <Input id="edit_cor" value={dadosOS.cor} onChange={(e) => handleDadosOSChange('cor', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_imei">IMEI / Serial</Label>
                <Input
                  id="edit_imei"
                  type="text"
                  value={dadosOS.imei_ou_serial}
                  onChange={(e) => handleDadosOSChange('imei_ou_serial', e.target.value)}
                  inputMode={dadosOS.tipo_aparelho === 'celular' ? 'numeric' : undefined}
                  pattern={dadosOS.tipo_aparelho === 'celular' ? '[0-9]*' : undefined}
                  maxLength={dadosOS.tipo_aparelho === 'celular' ? 15 : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_prioridade">Prioridade *</Label>
                <Select value={dadosOS.prioridade} onValueChange={(value) => handleDadosOSChange('prioridade', value)}>
                  <SelectTrigger id="edit_prioridade"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_prazo">Previsão de entrega</Label>
                <Input id="edit_prazo" type="date" value={dadosOS.prazo_estimado} onChange={(e) => handleDadosOSChange('prazo_estimado', e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit_acessorios">Acessórios entregues</Label>
                <Input id="edit_acessorios" value={dadosOS.acessorios_entregues} onChange={(e) => handleDadosOSChange('acessorios_entregues', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_senha">Senha informada</Label>
                <Input id="edit_senha" value={dadosOS.senha_informada} onChange={(e) => handleDadosOSChange('senha_informada', e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit_estado">Estado físico</Label>
                <Input id="edit_estado" value={dadosOS.estado_fisico} onChange={(e) => handleDadosOSChange('estado_fisico', e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="edit_defeito">Defeito relatado *</Label>
                <Textarea id="edit_defeito" value={dadosOS.defeito_relatado} onChange={(e) => handleDadosOSChange('defeito_relatado', e.target.value)} required />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="edit_defeito_inicial">Defeito inicial no aparelho</Label>
                <Textarea id="edit_defeito_inicial" value={dadosOS.defeito_relatado_inicial} onChange={(e) => handleDadosOSChange('defeito_relatado_inicial', e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="edit_observacoes">Observações gerais</Label>
                <Textarea id="edit_observacoes" value={dadosOS.observacoes_gerais} onChange={(e) => handleDadosOSChange('observacoes_gerais', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Acompanhamento por QR Code</DialogTitle>
          </DialogHeader>
          {qrInfo && (
            <div className="space-y-4 text-center">
              <img src={qrInfo.qrUrl} alt="QR Code da OS" className="mx-auto h-60 w-60 rounded-md border bg-white p-2" />
              <Input value={qrInfo.url} readOnly />
              <Button variant="outline" onClick={() => window.open(qrInfo.url, '_blank', 'noopener,noreferrer')} className="w-full">
                Abrir link publico
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              {canDiagnosticar && <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>}
              {canVerOrcamento && <TabsTrigger value="orcamento">Orçamento</TabsTrigger>}
              {canDiagnosticar && <TabsTrigger value="execucao">Execução</TabsTrigger>}
              {canVerFinalizacao && <TabsTrigger value="finalizacao">Finalização</TabsTrigger>}
              <TabsTrigger value="checklists">Checklists</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              {canVerRelatorio && <TabsTrigger value="relatorio">Relatório</TabsTrigger>}
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

              {os.anexos && os.anexos.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Anexos</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {os.anexos.map((anexo, index) => {
                      const isVideo = anexo.tipo?.startsWith('video/');
                      return (
                        <div key={anexo.id_anexo || `${anexo.nome}-${index}`} className="rounded-md border p-3">
                          <div className="mb-3 flex items-center gap-2">
                            {isVideo ? <Video className="h-4 w-4 text-blue-600" /> : <FileImage className="h-4 w-4 text-emerald-600" />}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">{anexo.nome || 'Anexo'}</p>
                              <p className="text-xs text-gray-500">{formatarTamanho(anexo.tamanho)}</p>
                            </div>
                          </div>
                          {isVideo ? (
                            <video src={anexo.conteudo} controls className="h-44 w-full rounded-md bg-gray-100 object-cover" />
                          ) : (
                            <img src={anexo.conteudo} alt={anexo.nome || 'Anexo'} className="h-44 w-full rounded-md bg-gray-100 object-cover" />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
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
                  <div className="space-y-2">
                    <Label>Fotos da avaliação</Label>
                    <AttachmentInput
                      value={diagnostico.anexos_avaliacao}
                      onChange={(anexos) => setDiagnostico({ ...diagnostico, anexos_avaliacao: anexos })}
                      disabled={!canDiagnosticar || saving}
                      accept="image/*"
                      allowedKinds={['image']}
                      buttonLabel="Adicionar foto da avaliação"
                      maxFiles={6}
                    />
                  </div>
                  {canDiagnosticar ? <Button onClick={salvarDiagnostico} disabled={saving}><Save className="h-4 w-4 mr-2" />Salvar diagnóstico</Button> : <p className="text-sm text-gray-500">Somente técnico ou administrador podem editar o diagnóstico.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orcamento" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Orçamento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Valor mão de obra</Label><Input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={orcamento.valor_mao_obra} onChange={(e) => setOrcamento({ ...orcamento, valor_mao_obra: onlyDigits(e.target.value) })} disabled={!canEditarOrcamento || saving} /></div>
                    <div className="space-y-2"><Label>Valor de peças</Label><Input type="number" min="0" inputMode="numeric" pattern="[0-9]*" value={orcamento.valor_pecas} onChange={(e) => setOrcamento({ ...orcamento, valor_pecas: onlyDigits(e.target.value) })} disabled={!canEditarOrcamento || saving} /></div>
                  </div>
                  <div className="space-y-2"><Label>Status da aprovação</Label><Select value={orcamento.status_aprovacao} onValueChange={(value) => setOrcamento({ ...orcamento, status_aprovacao: value })} disabled={!canAprovar || saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Observação da aprovação</Label><Textarea value={orcamento.observacao_aprovacao} onChange={(e) => setOrcamento({ ...orcamento, observacao_aprovacao: e.target.value })} disabled={!(canAprovar || canDiagnosticar) || saving} /></div>
                  <div className="rounded-lg border p-4 bg-gray-50"><p className="text-sm text-gray-600">Total estimado</p><p className="text-xl font-medium">{moeda(Number(orcamento.valor_mao_obra || 0) + Number(orcamento.valor_pecas || 0))}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {canEditarOrcamento && <Button onClick={salvarOrcamento} disabled={saving}><DollarSign className="h-4 w-4 mr-2" />Salvar orçamento</Button>}
                    {(canDiagnosticar || canAprovar) && <Button variant="outline" onClick={enviarAvaliacaoWhatsApp} disabled={saving}><MessageCircle className="h-4 w-4 mr-2" />Enviar avaliação no WhatsApp</Button>}
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
                  <div className="space-y-2">
                    <Label>Fotos do serviço feito</Label>
                    <AttachmentInput
                      value={servico.anexos_servico}
                      onChange={(anexos) => setServico({ ...servico, anexos_servico: anexos })}
                      disabled={!canDiagnosticar || saving}
                      accept="image/*"
                      allowedKinds={['image']}
                      buttonLabel="Adicionar foto do serviço"
                      maxFiles={6}
                    />
                  </div>
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
                    <div className="space-y-2"><Label>Forma de pagamento</Label><Select value={pagamento.forma_pagamento} onValueChange={(value) => setPagamento({ ...pagamento, forma_pagamento: value })} disabled={!canFinanceiro || saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="cartao_credito">Cartao de credito</SelectItem><SelectItem value="cartao_debito">Cartao de debito</SelectItem><SelectItem value="boleto">Boleto</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Status do pagamento</Label><Select value={pagamento.status_pagamento} onValueChange={(value) => setPagamento({ ...pagamento, status_pagamento: value })} disabled={!canFinanceiro || saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="parcial">Parcial</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent></Select></div>
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

            <TabsContent value="checklists" className="space-y-4">
              {renderChecklist('Checklist de entrada', checklistEntrada, setChecklistEntrada, 'entrada')}
              {renderChecklist('Checklist de saida', checklistSaida, setChecklistSaida, 'saida')}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Timeline da OS</CardTitle></CardHeader>
                <CardContent>
                  {eventosTimeline.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum evento registrado.</p>
                  ) : (
                    <div className="space-y-4">
                      {eventosTimeline.map((evento, index) => (
                        <div key={`${evento.titulo}-${evento.data}-${index}`} className="relative border-l border-gray-200 pl-4">
                          <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-blue-600" />
                          <div className="rounded-md border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-gray-900">{evento.titulo || 'Evento'}</p>
                              <Badge className="bg-gray-100 text-gray-800">{evento.tipo || 'sistema'}</Badge>
                            </div>
                            {evento.descricao && <p className="mt-2 text-sm text-gray-700">{evento.descricao}</p>}
                            <p className="mt-2 text-xs text-gray-500">
                              {formatarData(evento.data)} por {evento.usuario || 'Sistema'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Garantia e retorno</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dias de garantia</Label>
                      <Input value={garantia.dias} onChange={(e) => setGarantia({ ...garantia, dias: onlyDigits(e.target.value) })} disabled={!canEntregar || saving} />
                    </div>
                    <div className="space-y-2">
                      <Label>Cobertura</Label>
                      <Input value={garantia.cobertura} onChange={(e) => setGarantia({ ...garantia, cobertura: e.target.value })} disabled={!canEntregar || saving} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Observacoes da garantia</Label>
                      <Textarea value={garantia.observacoes} onChange={(e) => setGarantia({ ...garantia, observacoes: e.target.value })} disabled={!canEntregar || saving} />
                    </div>
                  </div>
                  {os.garantia?.fim && <p className="text-sm text-gray-600">Garantia vigente ate {formatarData(os.garantia.fim)}</p>}
                  {canEntregar && <Button onClick={salvarGarantia} disabled={saving}><ShieldCheck className="h-4 w-4 mr-2" />Registrar garantia</Button>}
                  <div className="border-t pt-4 space-y-2">
                    <Label>Motivo para reabrir OS</Label>
                    <Textarea value={motivoReabertura} onChange={(e) => setMotivoReabertura(e.target.value)} placeholder="Ex: cliente retornou dentro da garantia relatando o mesmo problema" disabled={!canAlterarStatus || saving} />
                    {canAlterarStatus && <Button variant="outline" onClick={reabrirOS} disabled={saving || motivoReabertura.trim().length < 5}><RotateCcw className="h-4 w-4 mr-2" />Reabrir OS</Button>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {canVerRelatorio && (
              <TabsContent value="relatorio" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Relatório da avaliação</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <p><strong>Cliente:</strong> {os.cliente?.nome || 'Não informado'}</p>
                      <p><strong>WhatsApp:</strong> {formatPhone(os.cliente?.whatsapp || os.cliente?.telefone || '') || 'Não informado'}</p>
                      <p><strong>Problema:</strong> {os.diagnostico?.defeito_identificado || 'Pendente'}</p>
                      <p><strong>Total:</strong> {moeda(os.orcamento?.valor_total)}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Mensagem que será enviada</Label>
                      <Textarea
                        value={relatorioMensagem || 'Clique em "Carregar relatório" para gerar a mensagem com os dados salvos.'}
                        readOnly
                        rows={10}
                      />
                    </div>

                    {relatorioTelefone && <p className="text-sm text-gray-600">Destino: {formatPhone(relatorioTelefone)}</p>}

                    {os.diagnostico?.anexos_avaliacao && os.diagnostico.anexos_avaliacao.length > 0 && (
                      <div className="space-y-3">
                        <Label>Fotos anexadas ao relatório</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {os.diagnostico.anexos_avaliacao.map((anexo, index) => (
                            <div key={anexo.id || anexo.nome || index} className="rounded-md border p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <FileImage className="h-4 w-4 text-emerald-600" />
                                <p className="truncate text-sm font-medium text-gray-900">{anexo.nome}</p>
                              </div>
                              <img src={anexo.conteudo} alt={anexo.nome} className="h-44 w-full rounded-md bg-gray-100 object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={carregarRelatorioWhatsApp} disabled={saving}>
                        Carregar relatório
                      </Button>
                      <Button type="button" onClick={enviarRelatorioBusiness} disabled={saving}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Enviar pela API Business
                      </Button>
                      <Button type="button" variant="outline" onClick={enviarAvaliacaoWhatsApp} disabled={saving}>
                        Abrir no WhatsApp Web
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
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
              <p><strong>Anexos:</strong> {os.anexos?.length || 0}</p>
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

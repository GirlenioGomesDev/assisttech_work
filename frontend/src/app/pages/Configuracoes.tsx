// Tela de ajustes gerais usados pela assistencia.
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { apiRequest } from '../services/api';
import { Building2, FileText, Image, Save, Settings } from 'lucide-react';

interface Configuracao {
  empresa: {
    nome: string;
    razao_social?: string;
    documento?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    site?: string;
    logo_base64?: string;
    endereco?: {
      logradouro?: string;
      numero?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
      complemento?: string;
    };
  };
  operacional: {
    garantia_padrao_dias: number;
    cobertura_garantia: string;
    prazo_orcamento_horas: number;
    horario_atendimento?: string;
  };
  documentos: {
    rodape_os?: string;
    termo_garantia?: string;
    observacoes_orcamento?: string;
  };
  mensagens: {
    os_criada?: string;
    orcamento_pronto?: string;
    os_pronta?: string;
    entrega?: string;
  };
}

const configInicial: Configuracao = {
  empresa: {
    nome: 'AssistTech',
    endereco: {},
  },
  operacional: {
    garantia_padrao_dias: 90,
    cobertura_garantia: 'Garantia de servico conforme politica da empresa',
    prazo_orcamento_horas: 24,
  },
  documentos: {
    rodape_os: 'Obrigado pela preferencia.',
    termo_garantia: 'A garantia cobre exclusivamente o servico executado e as pecas substituidas, conforme descrito nesta ordem de servico.',
    observacoes_orcamento: '',
  },
  mensagens: {
    os_criada: '',
    orcamento_pronto: '',
    os_pronta: '',
    entrega: '',
  },
};

export function Configuracoes() {
  const [config, setConfig] = useState<Configuracao>(configInicial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const setEmpresa = (field: string, value: string) => {
    setConfig((current) => ({ ...current, empresa: { ...current.empresa, [field]: value } }));
  };

  const setEndereco = (field: string, value: string) => {
    setConfig((current) => ({
      ...current,
      empresa: {
        ...current.empresa,
        endereco: { ...(current.empresa.endereco || {}), [field]: value },
      },
    }));
  };

  const setOperacional = (field: string, value: string | number) => {
    setConfig((current) => ({ ...current, operacional: { ...current.operacional, [field]: value } }));
  };

  const setDocumentos = (field: string, value: string) => {
    setConfig((current) => ({ ...current, documentos: { ...current.documentos, [field]: value } }));
  };

  const setMensagens = (field: string, value: string) => {
    setConfig((current) => ({ ...current, mensagens: { ...current.mensagens, [field]: value } }));
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/configuracoes');
        setConfig({
          ...configInicial,
          ...data,
          empresa: { ...configInicial.empresa, ...(data.empresa || {}), endereco: { ...(data.empresa?.endereco || {}) } },
          operacional: { ...configInicial.operacional, ...(data.operacional || {}) },
          documentos: { ...configInicial.documentos, ...(data.documentos || {}) },
          mensagens: { ...configInicial.mensagens, ...(data.mensagens || {}) },
        });
      } catch (error: any) {
        alert(error.message || 'Erro ao carregar configuracoes');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const carregarLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Selecione uma imagem');
    if (file.size > 350_000) return alert('Use uma imagem de ate 350 KB');
    const reader = new FileReader();
    reader.onload = () => setEmpresa('logo_base64', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const salvar = async () => {
    try {
      setSaving(true);
      const data = await apiRequest('/configuracoes', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setConfig({
        ...configInicial,
        ...data,
        empresa: { ...configInicial.empresa, ...(data.empresa || {}), endereco: { ...(data.empresa?.endereco || {}) } },
        operacional: { ...configInicial.operacional, ...(data.operacional || {}) },
        documentos: { ...configInicial.documentos, ...(data.documentos || {}) },
        mensagens: { ...configInicial.mensagens, ...(data.mensagens || {}) },
      });
      alert('Configuracoes salvas com sucesso');
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card><CardContent className="p-10 text-center text-gray-500">Carregando configuracoes...</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Configuracoes da assistencia</h1>
          <p className="text-gray-600 dark:text-gray-400">Dados usados em impressao, garantia, atendimento e mensagens.</p>
        </div>
        <Button onClick={salvar} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Salvando...' : 'Salvar configuracoes'}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Dados da empresa</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div><Label>Nome fantasia</Label><Input value={config.empresa.nome || ''} onChange={(e) => setEmpresa('nome', e.target.value)} /></div>
          <div><Label>Razao social</Label><Input value={config.empresa.razao_social || ''} onChange={(e) => setEmpresa('razao_social', e.target.value)} /></div>
          <div><Label>CPF/CNPJ</Label><Input value={config.empresa.documento || ''} onChange={(e) => setEmpresa('documento', e.target.value)} /></div>
          <div><Label>E-mail</Label><Input type="email" value={config.empresa.email || ''} onChange={(e) => setEmpresa('email', e.target.value)} /></div>
          <div><Label>Telefone</Label><Input value={config.empresa.telefone || ''} onChange={(e) => setEmpresa('telefone', e.target.value)} /></div>
          <div><Label>WhatsApp</Label><Input value={config.empresa.whatsapp || ''} onChange={(e) => setEmpresa('whatsapp', e.target.value)} /></div>
          <div className="lg:col-span-2"><Label>Site</Label><Input value={config.empresa.site || ''} onChange={(e) => setEmpresa('site', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />Logo e endereco</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Label>Logo para impressao</Label>
            <Input type="file" accept="image/*" onChange={(e) => carregarLogo(e.target.files?.[0])} />
            {config.empresa.logo_base64 && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <img src={config.empresa.logo_base64} alt="Logo" className="h-16 max-w-36 object-contain" />
                <Button type="button" variant="outline" onClick={() => setEmpresa('logo_base64', '')}>Remover</Button>
              </div>
            )}
          </div>
          <div><Label>CEP</Label><Input value={config.empresa.endereco?.cep || ''} onChange={(e) => setEndereco('cep', e.target.value)} /></div>
          <div><Label>Logradouro</Label><Input value={config.empresa.endereco?.logradouro || ''} onChange={(e) => setEndereco('logradouro', e.target.value)} /></div>
          <div><Label>Numero</Label><Input value={config.empresa.endereco?.numero || ''} onChange={(e) => setEndereco('numero', e.target.value)} /></div>
          <div><Label>Bairro</Label><Input value={config.empresa.endereco?.bairro || ''} onChange={(e) => setEndereco('bairro', e.target.value)} /></div>
          <div><Label>Cidade</Label><Input value={config.empresa.endereco?.cidade || ''} onChange={(e) => setEndereco('cidade', e.target.value)} /></div>
          <div><Label>Estado</Label><Input value={config.empresa.endereco?.estado || ''} onChange={(e) => setEndereco('estado', e.target.value)} /></div>
          <div><Label>Complemento</Label><Input value={config.empresa.endereco?.complemento || ''} onChange={(e) => setEndereco('complemento', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Padroes operacionais</CardTitle></CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div><Label>Garantia padrao em dias</Label><Input type="number" value={config.operacional.garantia_padrao_dias} onChange={(e) => setOperacional('garantia_padrao_dias', Number(e.target.value || 0))} /></div>
          <div><Label>Prazo padrao de orcamento em horas</Label><Input type="number" value={config.operacional.prazo_orcamento_horas} onChange={(e) => setOperacional('prazo_orcamento_horas', Number(e.target.value || 0))} /></div>
          <div className="lg:col-span-2"><Label>Horario de atendimento</Label><Input value={config.operacional.horario_atendimento || ''} onChange={(e) => setOperacional('horario_atendimento', e.target.value)} placeholder="Segunda a sexta, 08h as 18h" /></div>
          <div className="lg:col-span-2"><Label>Cobertura padrao da garantia</Label><Textarea value={config.operacional.cobertura_garantia || ''} onChange={(e) => setOperacional('cobertura_garantia', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Documentos e mensagens</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div><Label>Termo de garantia</Label><Textarea rows={4} value={config.documentos.termo_garantia || ''} onChange={(e) => setDocumentos('termo_garantia', e.target.value)} /></div>
          <div><Label>Rodape da OS impressa</Label><Textarea rows={3} value={config.documentos.rodape_os || ''} onChange={(e) => setDocumentos('rodape_os', e.target.value)} /></div>
          <div><Label>Observacoes padrao do orcamento</Label><Textarea rows={3} value={config.documentos.observacoes_orcamento || ''} onChange={(e) => setDocumentos('observacoes_orcamento', e.target.value)} /></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div><Label>Mensagem OS criada</Label><Textarea value={config.mensagens.os_criada || ''} onChange={(e) => setMensagens('os_criada', e.target.value)} /></div>
            <div><Label>Mensagem orcamento pronto</Label><Textarea value={config.mensagens.orcamento_pronto || ''} onChange={(e) => setMensagens('orcamento_pronto', e.target.value)} /></div>
            <div><Label>Mensagem OS pronta</Label><Textarea value={config.mensagens.os_pronta || ''} onChange={(e) => setMensagens('os_pronta', e.target.value)} /></div>
            <div><Label>Mensagem entrega</Label><Textarea value={config.mensagens.entrega || ''} onChange={(e) => setMensagens('entrega', e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

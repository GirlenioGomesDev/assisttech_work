// Relatorios focados no historico dos clientes.
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { FileImage, MessageCircle, Search } from 'lucide-react';
import { apiRequest } from '../services/api';
import { formatPhone } from '../utils/onlyDigits';

interface OrdemServico {
  _id: string;
  id_os: string;
  status?: string;
  cliente?: { nome?: string; telefone?: string; whatsapp?: string };
  aparelho?: { marca?: string; modelo?: string };
  diagnostico?: {
    defeito_identificado?: string;
    solucao_recomendada?: string;
    anexos_avaliacao?: Array<{ id?: string; nome?: string; conteudo?: string }>;
  };
  orcamento?: { valor_total?: number };
  createdAt?: string;
}

const moeda = (valor?: number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function RelatoriosClientes() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [telefone, setTelefone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/os');
        setOrdens(Array.isArray(data) ? data : []);
      } catch (error: any) {
        alert(error.message || 'Erro ao carregar ordens de serviço');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const ordensFiltradas = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    return ordens.filter((os) => [os.id_os, os.cliente?.nome, os.aparelho?.marca, os.aparelho?.modelo, os.diagnostico?.defeito_identificado]
      .join(' ')
      .toLowerCase()
      .includes(termo));
  }, [ordens, searchTerm]);

  const selecionarOS = async (os: OrdemServico) => {
    try {
      setSaving(true);
      setSelectedOS(os);
      const data = await apiRequest(`/os/${os._id}/whatsapp/avaliacao`);
      setMensagem(data.mensagem || '');
      setTelefone(data.telefone || '');
    } catch (error: any) {
      setMensagem('');
      setTelefone('');
      alert(error.message || 'Erro ao gerar relatório');
    } finally {
      setSaving(false);
    }
  };

  const enviarBusiness = async () => {
    if (!selectedOS) return;

    try {
      setSaving(true);
      await apiRequest(`/os/${selectedOS._id}/whatsapp/avaliacao/enviar`, {
        method: 'POST',
        body: JSON.stringify({ mensagem }),
      });
      alert('Relatório enviado pelo WhatsApp Business');
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar relatório');
    } finally {
      setSaving(false);
    }
  };

  const abrirWhatsAppWeb = () => {
    if (!telefone || !mensagem) return;
    window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Relatórios de Clientes</h1>
        <p className="text-gray-600">Edite e envie relatórios de avaliação das ordens de serviço</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10" placeholder="Buscar OS ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {loading ? (
              <Card><CardContent className="p-8 text-center text-gray-500">Carregando OS...</CardContent></Card>
            ) : ordensFiltradas.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-gray-500">Nenhuma OS encontrada</CardContent></Card>
            ) : ordensFiltradas.map((os) => (
              <button key={os._id} type="button" onClick={() => selecionarOS(os)} className="w-full text-left">
                <Card className={selectedOS?._id === os._id ? 'border-blue-400 bg-blue-50' : 'hover:border-blue-300'}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <strong>OS #{os.id_os}</strong>
                      <Badge className="bg-gray-100 text-gray-800">{os.status || '---'}</Badge>
                    </div>
                    <p className="text-sm text-gray-900">{os.cliente?.nome || 'Cliente não informado'}</p>
                    <p className="text-xs text-gray-600">{os.aparelho?.marca || 'Aparelho'} {os.aparelho?.modelo || ''}</p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2">
          <Card>
            <CardHeader><CardTitle>Editor do relatório</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedOS ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <p><strong>Cliente:</strong> {selectedOS.cliente?.nome || 'N/A'}</p>
                    <p><strong>WhatsApp:</strong> {formatPhone(selectedOS.cliente?.whatsapp || selectedOS.cliente?.telefone || '') || 'N/A'}</p>
                    <p><strong>Total:</strong> {moeda(selectedOS.orcamento?.valor_total)}</p>
                    <p><strong>Destino API:</strong> {telefone ? formatPhone(telefone) : 'Carregue o relatório'}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={14} />
                  </div>

                  {selectedOS.diagnostico?.anexos_avaliacao && selectedOS.diagnostico.anexos_avaliacao.length > 0 && (
                    <div className="space-y-3">
                      <Label>Fotos da avaliação</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedOS.diagnostico.anexos_avaliacao.map((foto, index) => (
                          <div key={foto.id || foto.nome || index} className="rounded-md border p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <FileImage className="h-4 w-4 text-emerald-600" />
                              <p className="truncate text-sm font-medium">{foto.nome || `Foto ${index + 1}`}</p>
                            </div>
                            <img src={foto.conteudo} alt={foto.nome || `Foto ${index + 1}`} className="h-44 w-full rounded-md bg-gray-100 object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={enviarBusiness} disabled={saving || !mensagem}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar pela API Business
                    </Button>
                    <Button type="button" variant="outline" onClick={abrirWhatsAppWeb} disabled={!telefone || !mensagem}>
                      Abrir no WhatsApp Web
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-gray-500">Selecione uma OS para editar e enviar o relatório.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

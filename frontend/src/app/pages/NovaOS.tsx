import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle, Search, UserCheck } from 'lucide-react';
import { apiRequest } from '../services/api';
import { formatCpf, formatPhone, onlyDigits } from '../utils/onlyDigits';
import { AttachmentData, AttachmentInput } from '../components/AttachmentInput';

interface Cliente {
  _id: string;
  id_cliente: string;
  nome: string;
  telefone?: string;
  whatsapp?: string;
  cpf?: string;
  email?: string;
}

interface Usuario {
  _id: string;
  id_usuario: string;
  nome: string;
  perfil: string;
  perfis?: string[];
}

export function NovaOS() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [clienteSearch, setClienteSearch] = useState('');
  const [anexos, setAnexos] = useState<AttachmentData[]>([]);

  const [formData, setFormData] = useState({
    clienteId: '',
    tecnicoId: '',
    defeito_relatado: '',
    prioridade: '',
    prazo_estimado: '',
    observacoes_gerais: '',

    tipo_aparelho: '',
    marca: '',
    modelo: '',
    cor: '',
    imei_ou_serial: '',
    acessorios_entregues: '',
    senha_informada: '',
    estado_fisico: '',
    defeito_relatado_inicial: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregandoDados(true);

      const [clientesData, usuariosData] = await Promise.all([
        apiRequest('/clientes'),
        apiRequest('/usuarios'),
      ]);

      setClientes(clientesData || []);
      setTecnicos((usuariosData || []).filter((u: Usuario) => {
        const perfis = u.perfis?.length ? u.perfis : [u.perfil];
        return perfis.includes('tecnico');
      }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar clientes e técnicos');
    } finally {
      setCarregandoDados(false);
    }
  };

  const handleChange = (campo: string, valor: string) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: campo === 'imei_ou_serial' && prev.tipo_aparelho === 'celular' ? onlyDigits(valor) : valor,
    }));
  };

  const handleTipoAparelhoChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tipo_aparelho: value,
      imei_ou_serial: value === 'celular' ? onlyDigits(prev.imei_ou_serial) : prev.imei_ou_serial,
    }));
  };

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente._id === formData.clienteId),
    [clientes, formData.clienteId]
  );

  const clientesFiltrados = useMemo(() => {
    const termo = clienteSearch.trim().toLowerCase();
    const digitos = onlyDigits(clienteSearch);

    if (!termo) return clientes.slice(0, 6);

    return clientes
      .filter((cliente) => {
        const texto = [
          cliente.nome,
          cliente.id_cliente,
          cliente.email,
          cliente.telefone,
          cliente.whatsapp,
          cliente.cpf,
          formatPhone(cliente.telefone || ''),
          formatPhone(cliente.whatsapp || ''),
          formatCpf(cliente.cpf || ''),
        ]
          .join(' ')
          .toLowerCase();

        return texto.includes(termo) || (!!digitos && texto.includes(digitos));
      })
      .slice(0, 8);
  }, [clienteSearch, clientes]);

  const selecionarCliente = (cliente: Cliente) => {
    handleChange('clienteId', cliente._id);
    setClienteSearch(cliente.nome);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.clienteId ||
      !formData.tecnicoId ||
      !formData.defeito_relatado ||
      !formData.prioridade ||
      !formData.prazo_estimado ||
      !formData.tipo_aparelho ||
      !formData.marca ||
      !formData.modelo
    ) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        clienteId: formData.clienteId,
        tecnicoId: formData.tecnicoId,
        defeito_relatado: formData.defeito_relatado,
        prioridade: formData.prioridade,
        prazo_estimado: formData.prazo_estimado,
        observacoes_gerais: formData.observacoes_gerais,
        aparelho: {
          tipo_aparelho: formData.tipo_aparelho,
          marca: formData.marca,
          modelo: formData.modelo,
          cor: formData.cor,
          imei_ou_serial:
            formData.tipo_aparelho === 'celular'
              ? onlyDigits(formData.imei_ou_serial)
              : formData.imei_ou_serial,
          acessorios_entregues: formData.acessorios_entregues,
          senha_informada: formData.senha_informada,
          estado_fisico: formData.estado_fisico,
          defeito_relatado_inicial:
            formData.defeito_relatado_inicial || formData.defeito_relatado,
        },
        anexos,
      };

      await apiRequest('/os', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Ordem de Serviço criada com sucesso!');
      navigate('/ordens-servico');
    } catch (error) {
      console.error('Erro ao criar OS:', error);
      alert('Erro ao criar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Nova Ordem de Serviço</h1>
        <p className="text-gray-600">Preencha os dados para abrir uma nova OS</p>
      </div>

      {carregandoDados ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-gray-500">Carregando dados...</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Cliente e Técnico */}
            <Card>
              <CardHeader>
                <CardTitle>1. Cliente e Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clienteId">Cliente *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="clienteId"
                        value={clienteSearch}
                        onChange={(e) => {
                          setClienteSearch(e.target.value);
                          handleChange('clienteId', '');
                        }}
                        placeholder="Buscar por nome, CPF, telefone ou codigo"
                        className="pl-10"
                        autoComplete="off"
                      />
                    </div>

                    {clienteSelecionado ? (
                      <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                        <div className="flex items-center gap-2 font-medium">
                          <UserCheck className="h-4 w-4" />
                          {clienteSelecionado.nome}
                        </div>
                        <p className="mt-1 text-green-800">
                          {clienteSelecionado.id_cliente}
                          {clienteSelecionado.telefone ? ` • ${formatPhone(clienteSelecionado.telefone)}` : ''}
                          {clienteSelecionado.cpf ? ` • CPF ${formatCpf(clienteSelecionado.cpf)}` : ''}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto rounded-md border bg-white">
                        {clientesFiltrados.length > 0 ? (
                          clientesFiltrados.map((cliente) => (
                            <button
                              key={cliente._id}
                              type="button"
                              className="w-full border-b px-3 py-2 text-left last:border-b-0 hover:bg-blue-50"
                              onClick={() => selecionarCliente(cliente)}
                            >
                              <span className="block text-sm font-medium text-gray-900">{cliente.nome}</span>
                              <span className="block text-xs text-gray-600">
                                {cliente.id_cliente}
                                {cliente.telefone ? ` • ${formatPhone(cliente.telefone)}` : ''}
                                {cliente.whatsapp ? ` • WhatsApp ${formatPhone(cliente.whatsapp)}` : ''}
                                {cliente.cpf ? ` • CPF ${formatCpf(cliente.cpf)}` : ''}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-gray-500">Nenhum cliente encontrado</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tecnicoId">Técnico Responsável *</Label>
                    <Select
                      value={formData.tecnicoId}
                      onValueChange={(value) => handleChange('tecnicoId', value)}
                    >
                      <SelectTrigger id="tecnicoId">
                        <SelectValue placeholder="Selecione o técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        {tecnicos.length > 0 ? (
                          tecnicos.map((tecnico) => (
                            <SelectItem key={tecnico._id} value={tecnico._id}>
                              {tecnico.nome}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="sem-tecnico" disabled>
                            Nenhum técnico cadastrado
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Aparelho */}
            <Card>
              <CardHeader>
                <CardTitle>2. Dados do Aparelho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_aparelho">Tipo do Aparelho *</Label>
                    <Select
                      value={formData.tipo_aparelho}
                      onValueChange={handleTipoAparelhoChange}
                    >
                      <SelectTrigger id="tipo_aparelho">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="celular">Celular</SelectItem>
                        <SelectItem value="notebook">Notebook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca *</Label>
                    <Input
                      id="marca"
                      name="marca"
                      value={formData.marca}
                      onChange={(e) => handleChange('marca', e.target.value)}
                      placeholder="Ex: Samsung"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input
                      id="modelo"
                      name="modelo"
                      value={formData.modelo}
                      onChange={(e) => handleChange('modelo', e.target.value)}
                      placeholder="Ex: Galaxy S21"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor</Label>
                    <Input
                      id="cor"
                      name="cor"
                      value={formData.cor}
                      onChange={(e) => handleChange('cor', e.target.value)}
                      placeholder="Ex: Preto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imei_ou_serial">IMEI / Serial</Label>
                    <Input
                      id="imei_ou_serial"
                      name="imei_ou_serial"
                      type="text"
                      value={formData.imei_ou_serial}
                      onChange={(e) => handleChange('imei_ou_serial', e.target.value)}
                      placeholder={formData.tipo_aparelho === 'celular' ? 'Digite o IMEI' : 'Digite o serial'}
                      inputMode={formData.tipo_aparelho === 'celular' ? 'numeric' : undefined}
                      pattern={formData.tipo_aparelho === 'celular' ? '[0-9]*' : undefined}
                      maxLength={formData.tipo_aparelho === 'celular' ? 15 : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="acessorios_entregues">Acessórios Entregues</Label>
                    <Input
                      id="acessorios_entregues"
                      name="acessorios_entregues"
                      value={formData.acessorios_entregues}
                      onChange={(e) => handleChange('acessorios_entregues', e.target.value)}
                      placeholder="Ex: carregador, capa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha_informada">Senha Informada</Label>
                    <Input
                      id="senha_informada"
                      name="senha_informada"
                      value={formData.senha_informada}
                      onChange={(e) => handleChange('senha_informada', e.target.value)}
                      placeholder="Se permitido"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="estado_fisico">Estado Físico</Label>
                    <Input
                      id="estado_fisico"
                      name="estado_fisico"
                      value={formData.estado_fisico}
                      onChange={(e) => handleChange('estado_fisico', e.target.value)}
                      placeholder="Ex: tela trincada, carcaça riscada"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Serviço */}
            <Card>
              <CardHeader>
                <CardTitle>3. Informações do Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defeito_relatado">Defeito Relatado *</Label>
                  <Textarea
                    id="defeito_relatado"
                    name="defeito_relatado"
                    value={formData.defeito_relatado}
                    onChange={(e) => handleChange('defeito_relatado', e.target.value)}
                    placeholder="Descreva o problema relatado pelo cliente..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defeito_relatado_inicial">Defeito Relatado Inicial no Aparelho</Label>
                  <Textarea
                    id="defeito_relatado_inicial"
                    name="defeito_relatado_inicial"
                    value={formData.defeito_relatado_inicial}
                    onChange={(e) => handleChange('defeito_relatado_inicial', e.target.value)}
                    placeholder="Ex: não liga, não carrega, tela quebrada..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prioridade">Prioridade *</Label>
                    <Select
                      value={formData.prioridade}
                      onValueChange={(value) => handleChange('prioridade', value)}
                    >
                      <SelectTrigger id="prioridade">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prazo_estimado">Previsão de Entrega *</Label>
                    <Input
                      id="prazo_estimado"
                      name="prazo_estimado"
                      type="date"
                      value={formData.prazo_estimado}
                      onChange={(e) => handleChange('prazo_estimado', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anexos */}
            <Card>
              <CardHeader>
                <CardTitle>4. Anexos</CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentInput value={anexos} onChange={setAnexos} disabled={loading} />
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>5. Observações (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="observacoes_gerais"
                  name="observacoes_gerais"
                  value={formData.observacoes_gerais}
                  onChange={(e) => handleChange('observacoes_gerais', e.target.value)}
                  placeholder="Observações adicionais sobre o atendimento..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/ordens-servico')}>
                Cancelar
              </Button>

              <Button type="submit" disabled={loading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Abrir Ordem de Serviço'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

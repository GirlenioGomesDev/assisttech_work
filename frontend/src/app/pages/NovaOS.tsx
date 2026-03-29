import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle } from 'lucide-react';
import { apiRequest } from '../services/api';

interface Cliente {
  _id: string;
  id_cliente: string;
  nome: string;
  telefone?: string;
  whatsapp?: string;
}

interface Usuario {
  _id: string;
  id_usuario: string;
  nome: string;
  perfil: string;
}

export function NovaOS() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);

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
      setTecnicos((usuariosData || []).filter((u: Usuario) => u.perfil === 'tecnico'));
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
      [campo]: valor,
    }));
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
          imei_ou_serial: formData.imei_ou_serial,
          acessorios_entregues: formData.acessorios_entregues,
          senha_informada: formData.senha_informada,
          estado_fisico: formData.estado_fisico,
          defeito_relatado_inicial:
            formData.defeito_relatado_inicial || formData.defeito_relatado,
        },
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
                    <Select
                      value={formData.clienteId}
                      onValueChange={(value) => handleChange('clienteId', value)}
                    >
                      <SelectTrigger id="clienteId">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente._id} value={cliente._id}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      onValueChange={(value) => handleChange('tipo_aparelho', value)}
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
                      value={formData.imei_ou_serial}
                      onChange={(e) => handleChange('imei_ou_serial', e.target.value)}
                      placeholder="Digite o IMEI ou serial"
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

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>4. Observações (Opcional)</CardTitle>
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
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Plus, Search, Phone, Mail, MapPin, Edit, History, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { apiRequest } from '../services/api';
import { formatCpf, formatPhone, onlyDigits } from '../utils/onlyDigits';

interface Cliente {
  _id: string;
  id_cliente: string;
  nome: string;
  telefone: string;
  whatsapp?: string;
  cpf: string;
  email?: string;
  endereco?: {
    cep?: string;
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  observacoes?: string;
}

export function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const canEditCliente = ['admin', 'atendente'].includes(user?.perfil);
  const canDeleteCliente = user?.perfil === 'admin';

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    observacoes: '',
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/clientes');
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const numericFields = new Set(['cpf', 'telefone', 'whatsapp']);

  const emptyForm = {
    nome: '',
    cpf: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    observacoes: '',
  };

  const resetForm = () => {
    setEditingCliente(null);
    setFormData(emptyForm);
  };

  const abrirEdicaoCliente = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome || '',
      cpf: cliente.cpf || '',
      telefone: cliente.telefone || '',
      whatsapp: cliente.whatsapp || '',
      email: cliente.email || '',
      endereco: cliente.endereco?.rua || '',
      observacoes: cliente.observacoes || '',
    });
    setDialogOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: numericFields.has(field) ? onlyDigits(value) : value,
    }));
  };

  const handleSalvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const enderecoTexto = formData.endereco || '';

      const payload = {
        nome: formData.nome,
        telefone: formData.telefone,
        whatsapp: formData.whatsapp,
        cpf: formData.cpf,
        email: formData.email,
        endereco: {
          rua: enderecoTexto,
          numero: editingCliente?.endereco?.numero || '',
          bairro: editingCliente?.endereco?.bairro || '',
          cidade: editingCliente?.endereco?.cidade || '',
          estado: editingCliente?.endereco?.estado || '',
          cep: editingCliente?.endereco?.cep || '',
        },
        observacoes: formData.observacoes,
      };

      await apiRequest(editingCliente ? `/clientes/${editingCliente._id}` : '/clientes', {
        method: editingCliente ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setDialogOpen(false);
      resetForm();

      await carregarClientes();
      alert(editingCliente ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      alert(error.message || 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleExcluirCliente = async (cliente: Cliente) => {
    const confirmou = window.confirm(`Tem certeza que deseja apagar o cliente ${cliente.nome}?`);
    if (!confirmou) return;

    try {
      setSaving(true);
      await apiRequest(`/clientes/${cliente._id}`, { method: 'DELETE' });
      await carregarClientes();
      alert('Cliente apagado com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao apagar cliente');
    } finally {
      setSaving(false);
    }
  };

  const searchDigits = onlyDigits(searchTerm);
  const filteredClientes = clientes.filter((cliente) => {
    const searchText = searchTerm.toLowerCase();

    return (
      cliente.nome?.toLowerCase().includes(searchText) ||
      cliente.telefone?.includes(searchDigits) ||
      cliente.cpf?.includes(searchDigits) ||
      formatPhone(cliente.telefone || '').includes(searchTerm) ||
      formatCpf(cliente.cpf || '').includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie o cadastro de clientes</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleSalvarCliente}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.\-]*"
                    maxLength={14}
                    required
                    value={formatCpf(formData.cpf)}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9() \-]*"
                    maxLength={15}
                    required
                    value={formatPhone(formData.telefone)}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(00) 00000-0000"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9() \-]*"
                    maxLength={15}
                    value={formatPhone(formData.whatsapp)}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, bairro, cidade..."
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : editingCliente ? 'Salvar alterações' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, telefone ou CPF..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Carregando clientes...</p>
          </CardContent>
        </Card>
      )}

      {/* Clientes List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <Card key={cliente._id}>
              <CardHeader>
                <CardTitle className="text-lg">{cliente.nome}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    {formatPhone(cliente.telefone)}
                  </div>

                  {cliente.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      {cliente.email}
                    </div>
                  )}

                  {cliente.endereco?.rua && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="flex-1">
                        {cliente.endereco?.rua}
                        {cliente.endereco?.numero ? `, ${cliente.endereco.numero}` : ''}
                        {cliente.endereco?.bairro ? ` - ${cliente.endereco.bairro}` : ''}
                        {cliente.endereco?.cidade ? `, ${cliente.endereco.cidade}` : ''}
                        {cliente.endereco?.estado ? `/${cliente.endereco.estado}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="text-gray-500">
                    CPF: {formatCpf(cliente.cpf)}
                  </div>
                </div>

                {cliente.observacoes && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700">
                    {cliente.observacoes}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {canEditCliente && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => abrirEdicaoCliente(cliente)} disabled={saving}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}

                  <Link to={`/historico-cliente/${cliente._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <History className="h-4 w-4 mr-2" />
                      Histórico
                    </Button>
                  </Link>

                  {canDeleteCliente && (
                    <Button variant="outline" size="sm" onClick={() => handleExcluirCliente(cliente)} disabled={saving}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredClientes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

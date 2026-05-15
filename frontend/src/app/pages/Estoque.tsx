import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { apiRequest } from '../services/api';

interface EstoqueItem {
  _id: string;
  id_item: string;
  nome: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  quantidade: number;
  estoque_minimo: number;
  valor_unitario: number;
  fornecedor?: string;
  observacoes?: string;
}

const emptyForm = {
  nome: '',
  categoria: '',
  marca: '',
  modelo: '',
  quantidade: '0',
  estoque_minimo: '0',
  valor_unitario: '0',
  fornecedor: '',
  observacoes: '',
};

const moeda = (valor: number) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Estoque() {
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstoqueItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/estoque');
      setItens(Array.isArray(data) ? data : []);
    } catch (error: any) {
      alert(error.message || 'Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const itensFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return itens;

    return itens.filter((item) => [item.id_item, item.nome, item.categoria, item.marca, item.modelo, item.fornecedor]
      .join(' ')
      .toLowerCase()
      .includes(termo));
  }, [itens, searchTerm]);

  const baixoEstoque = itens.filter((item) => Number(item.quantidade || 0) <= Number(item.estoque_minimo || 0)).length;

  const abrirNovo = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const abrirEdicao = (item: EstoqueItem) => {
    setEditingItem(item);
    setForm({
      nome: item.nome || '',
      categoria: item.categoria || '',
      marca: item.marca || '',
      modelo: item.modelo || '',
      quantidade: String(item.quantidade || 0),
      estoque_minimo: String(item.estoque_minimo || 0),
      valor_unitario: String(item.valor_unitario || 0),
      fornecedor: item.fornecedor || '',
      observacoes: item.observacoes || '',
    });
    setDialogOpen(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      quantidade: Number(form.quantidade || 0),
      estoque_minimo: Number(form.estoque_minimo || 0),
      valor_unitario: Number(form.valor_unitario || 0),
    };

    try {
      setSaving(true);
      await apiRequest(editingItem ? `/estoque/${editingItem._id}` : '/estoque', {
        method: editingItem ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setDialogOpen(false);
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar item');
    } finally {
      setSaving(false);
    }
  };

  const remover = async (item: EstoqueItem) => {
    const confirmou = window.confirm(`Remover ${item.nome} do estoque?`);
    if (!confirmou) return;

    try {
      setSaving(true);
      await apiRequest(`/estoque/${item._id}`, { method: 'DELETE' });
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao remover item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Estoque</h1>
          <p className="text-gray-600">Controle peças, acessórios e itens usados nos serviços</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={abrirNovo}><Plus className="h-4 w-4 mr-2" />Novo Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingItem ? 'Editar item' : 'Cadastrar item'}</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={salvar}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input id="categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Tela, bateria, conector..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input id="fornecedor" value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input id="marca" value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input id="modelo" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input id="quantidade" type="number" min="0" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo">Estoque mínimo</Label>
                  <Input id="estoque_minimo" type="number" min="0" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="valor_unitario">Valor unitário</Label>
                  <Input id="valor_unitario" type="number" min="0" step="0.01" value={form.valor_unitario} onChange={(e) => setForm({ ...form, valor_unitario: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea id="observacoes" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Itens ativos</p><p className="text-2xl mt-1">{itens.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Baixo estoque</p><p className="text-2xl mt-1">{baixoEstoque}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-600">Valor em estoque</p><p className="text-2xl mt-1">{moeda(itens.reduce((sum, item) => sum + Number(item.quantidade || 0) * Number(item.valor_unitario || 0), 0))}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-10" placeholder="Buscar por item, categoria, marca, modelo ou fornecedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-gray-500">Carregando estoque...</CardContent></Card>
      ) : itensFiltrados.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">Nenhum item encontrado</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {itensFiltrados.map((item) => {
            const lowStock = Number(item.quantidade || 0) <= Number(item.estoque_minimo || 0);
            return (
              <Card key={item._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.nome}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{item.id_item} {item.categoria ? `• ${item.categoria}` : ''}</p>
                    </div>
                    {lowStock && <Badge className="bg-red-100 text-red-800">Baixo estoque</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <p><strong>Quantidade:</strong> {item.quantidade}</p>
                    <p><strong>Mínimo:</strong> {item.estoque_minimo}</p>
                    <p><strong>Marca:</strong> {item.marca || 'N/A'}</p>
                    <p><strong>Modelo:</strong> {item.modelo || 'N/A'}</p>
                    <p><strong>Valor:</strong> {moeda(item.valor_unitario)}</p>
                    <p><strong>Fornecedor:</strong> {item.fornecedor || 'N/A'}</p>
                  </div>
                  {item.observacoes && <p className="text-sm text-gray-600">{item.observacoes}</p>}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => abrirEdicao(item)} disabled={saving}><Edit className="h-4 w-4 mr-2" />Editar</Button>
                    <Button type="button" variant="outline" onClick={() => remover(item)} disabled={saving}><Trash2 className="h-4 w-4 mr-2" />Apagar</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Tela para gerenciar usuarios e perfis.
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Edit, Plus, Shield, Trash2, UserCog, Users as UsersIcon } from 'lucide-react';
import { apiRequest } from '../services/api';

type Perfil = 'admin' | 'atendente' | 'tecnico' | 'financeiro';

interface Usuario {
  _id: string;
  nome: string;
  email: string;
  login: string;
  perfil: Perfil;
  perfis?: Perfil[];
  ativo: boolean;
}

const perfilOptions: Array<{ value: Perfil; label: string; description: string }> = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
  { value: 'atendente', label: 'Atendente', description: 'Clientes, abertura de OS e entregas' },
  { value: 'tecnico', label: 'Técnico', description: 'Consulta e execução das OS' },
  { value: 'financeiro', label: 'Financeiro', description: 'Pagamentos e relatórios' },
];

const perfilColors: Record<Perfil, string> = {
  admin: 'bg-purple-100 text-purple-800',
  atendente: 'bg-blue-100 text-blue-800',
  tecnico: 'bg-green-100 text-green-800',
  financeiro: 'bg-yellow-100 text-yellow-800',
};

const perfilIcons: Record<Perfil, typeof Shield> = {
  admin: Shield,
  atendente: UsersIcon,
  tecnico: UserCog,
  financeiro: UserCog,
};

const emptyForm = {
  nome: '',
  email: '',
  login: '',
  senha: '',
  perfis: ['tecnico'] as Perfil[],
};

const getPerfis = (usuario: Usuario) => (
  usuario.perfis && usuario.perfis.length ? usuario.perfis : [usuario.perfil]
);

export function Usuarios() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      setUsuarios(await apiRequest('/usuarios'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const togglePerfil = (perfil: Perfil) => {
    setForm((current) => {
      const hasPerfil = current.perfis.includes(perfil);
      const perfis = hasPerfil
        ? current.perfis.filter((item) => item !== perfil)
        : [...current.perfis, perfil];

      return { ...current, perfis: perfis.length ? perfis : ['tecnico'] };
    });
  };

  const toggleEditPerfil = (perfil: Perfil) => {
    setEditForm((current) => {
      const hasPerfil = current.perfis.includes(perfil);
      const perfis = hasPerfil
        ? current.perfis.filter((item) => item !== perfil)
        : [...current.perfis, perfil];

      return { ...current, perfis: perfis.length ? perfis : ['tecnico'] };
    });
  };

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      await apiRequest('/usuarios', {
        method: 'POST',
        body: JSON.stringify({ ...form, perfil: form.perfis[0] }),
      });
      setDialogOpen(false);
      setForm(emptyForm);
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao cadastrar usuário');
    } finally {
      setSaving(false);
    }
  };

  const abrirEdicao = (usuario: Usuario) => {
    setEditingUser(usuario);
    setEditForm({
      nome: usuario.nome,
      email: usuario.email,
      login: usuario.login,
      senha: '',
      perfis: getPerfis(usuario),
    });
    setEditDialogOpen(true);
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      await apiRequest(`/usuarios/${editingUser._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: editForm.nome,
          email: editForm.email,
          login: editForm.login,
          senha: editForm.senha || undefined,
          perfil: editForm.perfis[0],
          perfis: editForm.perfis,
        }),
      });
      setEditDialogOpen(false);
      setEditingUser(null);
      setEditForm(emptyForm);
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const deletarUsuario = async (usuario: Usuario) => {
    const confirmou = window.confirm(`Tem certeza que deseja apagar o usuário ${usuario.nome}?`);
    if (!confirmou) return;

    try {
      setSaving(true);
      await apiRequest(`/usuarios/${usuario._id}`, { method: 'DELETE' });
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao apagar usuário');
    } finally {
      setSaving(false);
    }
  };

  const totalAdmins = useMemo(
    () => usuarios.filter((usuario) => getPerfis(usuario).includes('admin')).length,
    [usuarios]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie os usuários e suas funções no sistema</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Cadastrar Usuário</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={criar}>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="login">Login *</Label>
                  <Input id="login" required value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input id="senha" type="password" required value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Funções *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perfilOptions.map((option) => (
                    <label key={option.value} className="flex cursor-pointer gap-3 rounded-md border p-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={form.perfis.includes(option.value)}
                        onChange={() => togglePerfil(option.value)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                        <span className="block text-xs text-gray-500">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Cadastrando...' : 'Cadastrar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
            <form className="space-y-4" onSubmit={salvarEdicao}>
              <div className="space-y-2">
                <Label htmlFor="edit_nome">Nome Completo *</Label>
                <Input id="edit_nome" required value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_email">E-mail *</Label>
                <Input id="edit_email" type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_login">Login *</Label>
                  <Input id="edit_login" required value={editForm.login} onChange={(e) => setEditForm({ ...editForm, login: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_senha">Nova senha</Label>
                  <Input id="edit_senha" type="password" value={editForm.senha} onChange={(e) => setEditForm({ ...editForm, senha: e.target.value })} placeholder="Deixe vazio para manter" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Funções *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perfilOptions.map((option) => (
                    <label key={option.value} className="flex cursor-pointer gap-3 rounded-md border p-3 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={editForm.perfis.includes(option.value)}
                        onChange={() => toggleEditPerfil(option.value)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                        <span className="block text-xs text-gray-500">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 mb-3">Você pode combinar funções no mesmo usuário. Administradores cadastrados: {totalAdmins}</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-blue-800">
            {perfilOptions.map((option) => <div key={option.value}><strong>{option.label}:</strong> {option.description}</div>)}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-12 text-center"><p className="text-gray-500">Carregando usuários...</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuarios.map((usuario) => {
            const perfis = getPerfis(usuario);
            const Icon = perfilIcons[perfis[0]];

            return (
              <Card key={usuario._id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded"><Icon className="h-5 w-5 text-gray-600" /></div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{usuario.nome}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1 truncate">{usuario.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" size="icon" variant="ghost" onClick={() => abrirEdicao(usuario)} disabled={saving} aria-label="Editar usuário">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => deletarUsuario(usuario)} disabled={saving} aria-label="Apagar usuário">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-gray-600">Login:</span>
                      <span>{usuario.login}</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-gray-600">Funções:</span>
                      <div className="flex flex-wrap gap-2">
                        {perfis.map((perfil) => (
                          <Badge key={perfil} className={perfilColors[perfil]}>
                            {perfilOptions.find((option) => option.value === perfil)?.label || perfil}
                          </Badge>
                        ))}
                      </div>
                    </div>
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

import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, UserCog, Shield, Users as UsersIcon } from 'lucide-react';
import { apiRequest } from '../services/api';

interface Usuario { _id:string; nome:string; email:string; login:string; perfil:'admin'|'atendente'|'tecnico'|'financeiro'; ativo:boolean }

export function Usuarios() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [form, setForm] = useState({ nome:'', email:'', login:'', senha:'', perfil:'tecnico' });
  const [loading, setLoading] = useState(true);
  const carregar = async()=>{ setLoading(true); try { setUsuarios(await apiRequest('/usuarios')); } finally { setLoading(false);} };
  useEffect(()=>{carregar();},[]);
  const criar = async (e: React.FormEvent)=>{ e.preventDefault(); await apiRequest('/usuarios',{method:'POST',body:JSON.stringify(form)}); setDialogOpen(false); setForm({ nome:'', email:'', login:'', senha:'', perfil:'tecnico' }); await carregar(); };
  const nivelAcessoColors = { admin:'bg-purple-100 text-purple-800', atendente:'bg-blue-100 text-blue-800', tecnico:'bg-green-100 text-green-800', financeiro:'bg-yellow-100 text-yellow-800' };
  const nivelAcessoIcons = { admin: Shield, atendente: UsersIcon, tecnico: UserCog, financeiro: UserCog };
  return <div className="space-y-6"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-2xl text-gray-900">Usuários</h1><p className="text-gray-600">Gerencie os usuários do sistema</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo Usuário</Button></DialogTrigger><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Cadastrar Usuário</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={criar}><div className="space-y-2"><Label htmlFor="nome">Nome Completo *</Label><Input id="nome" required value={form.nome} onChange={(e)=>setForm({...form,nome:e.target.value})} /></div><div className="space-y-2"><Label htmlFor="email">E-mail *</Label><Input id="email" type="email" required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} /></div><div className="space-y-2"><Label htmlFor="login">Login *</Label><Input id="login" required value={form.login} onChange={(e)=>setForm({...form,login:e.target.value})} /></div><div className="space-y-2"><Label htmlFor="senha">Senha *</Label><Input id="senha" type="password" required value={form.senha} onChange={(e)=>setForm({...form,senha:e.target.value})} /></div><div className="space-y-2"><Label htmlFor="perfil">Perfil *</Label><Select value={form.perfil} onValueChange={(v)=>setForm({...form,perfil:v})}><SelectTrigger id="perfil"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="atendente">Atendente</SelectItem><SelectItem value="tecnico">Técnico</SelectItem><SelectItem value="financeiro">Financeiro</SelectItem></SelectContent></Select></div><div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button type="submit">Cadastrar</Button></div></form></DialogContent></Dialog></div>
  <Card className="bg-blue-50 border-blue-200"><CardContent className="p-4"><p className="text-sm text-blue-900 mb-3">Perfis de acesso:</p><div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-blue-800"><div><strong>Administrador:</strong> acesso total</div><div><strong>Atendente:</strong> clientes e abertura de OS</div><div><strong>Técnico:</strong> consulta e execução</div><div><strong>Financeiro:</strong> pagamentos e relatórios</div></div></CardContent></Card>
  {loading ? <Card><CardContent className="p-12 text-center"><p className="text-gray-500">Carregando usuários...</p></CardContent></Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{usuarios.map((usuario)=>{const Icon = nivelAcessoIcons[usuario.perfil]; return <Card key={usuario._id}><CardHeader><div className="flex items-start gap-3"><div className="p-2 bg-gray-100 rounded"><Icon className="h-5 w-5 text-gray-600" /></div><div className="flex-1"><CardTitle className="text-lg">{usuario.nome}</CardTitle><p className="text-sm text-gray-500 mt-1">{usuario.email}</p></div></div></CardHeader><CardContent className="space-y-3"><div className="space-y-2 text-sm"><div className="flex justify-between items-center"><span className="text-gray-600">Login:</span><span>{usuario.login}</span></div><div className="flex justify-between items-center"><span className="text-gray-600">Perfil:</span><Badge className={nivelAcessoColors[usuario.perfil]}>{usuario.perfil}</Badge></div></div></CardContent></Card>})}</div>}</div>
}

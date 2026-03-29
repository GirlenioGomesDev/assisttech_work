import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, Smartphone, FileText, Wrench, DollarSign, Package, UserCog, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin','atendente','tecnico','financeiro'] },
  { name: 'Clientes', href: '/clientes', icon: Users, roles: ['admin','atendente'] },
  { name: 'Aparelhos', href: '/aparelhos', icon: Smartphone, roles: ['admin','atendente','tecnico'] },
  { name: 'Ordens de Serviço', href: '/ordens-servico', icon: FileText, roles: ['admin','atendente','tecnico'] },
  { name: 'Nova OS', href: '/nova-os', icon: Wrench, roles: ['admin','atendente'] },
  { name: 'Pagamentos', href: '/pagamentos', icon: DollarSign, roles: ['admin','financeiro'] },
  { name: 'Entregas', href: '/entregas', icon: Package, roles: ['admin','atendente'] },
  { name: 'Usuários', href: '/usuarios', icon: UserCog, roles: ['admin'] },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, roles: ['admin','financeiro'] },
];

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = navigation.filter(i => user && i.roles.includes(user.perfil));
  return (<div className="min-h-screen bg-gray-50">{sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
  <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
  <div className="flex flex-col h-full"><div className="flex items-center justify-between h-16 px-6 border-b border-gray-200"><h1 className="font-semibold text-lg">AssistTech</h1><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></Button></div>
  <div className="px-6 py-4 border-b border-gray-200"><p className="text-sm text-gray-900">{user?.nome}</p><p className="text-xs text-gray-500 capitalize">{user?.perfil}</p></div>
  <nav className="flex-1 px-3 py-4 overflow-y-auto"><ul className="space-y-1">{nav.map((item)=>{const Icon=item.icon;const isActive=location.pathname===item.href;return <li key={item.name}><Link to={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`} onClick={()=>setSidebarOpen(false)}><Icon className="h-5 w-5" /><span className="text-sm">{item.name}</span></Link></li>})}</ul></nav>
  <div className="p-3 border-t border-gray-200"><Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={()=>{logout();navigate('/login')}}><LogOut className="h-5 w-5 mr-3" />Sair</Button></div></div></div>
  <div className="lg:pl-64"><div className="sticky top-0 z-30 flex items-center h-16 px-6 bg-white border-b border-gray-200"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button><div className="flex-1 lg:ml-0 ml-4"><h2 className="text-lg text-gray-900">{nav.find(item => item.href === location.pathname)?.name || 'AssistTech'}</h2></div></div><main className="p-6"><Outlet /></main></div></div>);
}

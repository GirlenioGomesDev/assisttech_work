import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, LayoutDashboard, Users, Smartphone, FileText, Wrench, DollarSign, Package, UserCog, BarChart3, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin','atendente','tecnico','financeiro'] },
  { name: 'Clientes', href: '/clientes', icon: Users, roles: ['admin','atendente'] },
  { name: 'Aparelhos', href: '/aparelhos', icon: Smartphone, roles: ['admin','atendente','tecnico'] },
  { name: 'Ordens de Serviço', href: '/ordens-servico', icon: FileText, roles: ['admin','atendente','tecnico'] },
  { name: 'Relatórios de Clientes', href: '/relatorios-clientes', icon: FileText, roles: ['admin','atendente','tecnico'] },
  { name: 'Nova OS', href: '/nova-os', icon: Wrench, roles: ['admin','atendente'] },
  { name: 'Pagamentos', href: '/pagamentos', icon: DollarSign, roles: ['admin','financeiro'] },
  { name: 'Estoque', href: '/estoque', icon: Package, roles: ['admin','atendente','financeiro'] },
  { name: 'Entregas', href: '/entregas', icon: Package, roles: ['admin','atendente'] },
  { name: 'Usuários', href: '/usuarios', icon: UserCog, roles: ['admin'] },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, roles: ['admin','financeiro'] },
  { name: 'Auditoria', href: '/auditoria', icon: ClipboardList, roles: ['admin'] },
];

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  });
  const perfis = user?.perfis?.length ? user.perfis : user ? [user.perfil] : [];
  const nav = navigation.filter(i => perfis.some((perfil) => i.roles.includes(perfil)));
  const perfilLabel = perfis.join(', ');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (<div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">{sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
  <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out dark:bg-gray-900 dark:border-gray-800 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
  <div className="flex flex-col h-full"><div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800"><h1 className="font-semibold text-lg">AssistTech</h1><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></Button></div>
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800"><p className="text-sm text-gray-900 dark:text-gray-100">{user?.nome}</p><p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{perfilLabel}</p></div>
  <nav className="flex-1 px-3 py-4 overflow-y-auto"><ul className="space-y-1">{nav.map((item)=>{const Icon=item.icon;const isActive=location.pathname===item.href;return <li key={item.name}><Link to={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`} onClick={()=>setSidebarOpen(false)}><Icon className="h-5 w-5" /><span className="text-sm">{item.name}</span></Link></li>})}</ul></nav>
  <div className="p-3 border-t border-gray-200 dark:border-gray-800"><Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950" onClick={()=>{logout();navigate('/login')}}><LogOut className="h-5 w-5 mr-3" />Sair</Button></div></div></div>
  <div className="lg:pl-64"><div className="sticky top-0 z-30 flex items-center h-16 px-6 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></Button><div className="flex-1 lg:ml-0 ml-4"><h2 className="text-lg text-gray-900 dark:text-gray-100">{nav.find(item => item.href === location.pathname)?.name || 'AssistTech'}</h2></div><Button type="button" variant="outline" size="icon" onClick={toggleTheme} title={theme === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'} aria-label={theme === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button></div><main className="p-6"><Outlet /></main></div></div>);
}

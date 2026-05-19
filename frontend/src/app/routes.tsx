// Define todas as rotas e bloqueios por perfil.
import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { Skeleton } from './components/ui/skeleton';
import { MainLayout } from './layouts/MainLayout';

const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Clientes = lazy(() => import('./pages/Clientes').then((module) => ({ default: module.Clientes })));
const Aparelhos = lazy(() => import('./pages/Aparelhos').then((module) => ({ default: module.Aparelhos })));
const OrdensServico = lazy(() => import('./pages/OrdensServico').then((module) => ({ default: module.OrdensServico })));
const NovaOS = lazy(() => import('./pages/NovaOS').then((module) => ({ default: module.NovaOS })));
const DetalhesOS = lazy(() => import('./pages/DetalhesOS').then((module) => ({ default: module.DetalhesOS })));
const Pagamentos = lazy(() => import('./pages/Pagamentos').then((module) => ({ default: module.Pagamentos })));
const Entregas = lazy(() => import('./pages/Entregas').then((module) => ({ default: module.Entregas })));
const Usuarios = lazy(() => import('./pages/Usuarios').then((module) => ({ default: module.Usuarios })));
const Relatorios = lazy(() => import('./pages/Relatorios').then((module) => ({ default: module.Relatorios })));
const RelatoriosClientes = lazy(() => import('./pages/RelatoriosClientes').then((module) => ({ default: module.RelatoriosClientes })));
const Estoque = lazy(() => import('./pages/Estoque').then((module) => ({ default: module.Estoque })));
const Auditoria = lazy(() => import('./pages/Auditoria').then((module) => ({ default: module.Auditoria })));
const HistoricoCliente = lazy(() => import('./pages/HistoricoCliente').then((module) => ({ default: module.HistoricoCliente })));
const OSPublica = lazy(() => import('./pages/OSPublica').then((module) => ({ default: module.OSPublica })));
const Notificacoes = lazy(() => import('./pages/Notificacoes').then((module) => ({ default: module.Notificacoes })));
const Seguranca = lazy(() => import('./pages/Seguranca').then((module) => ({ default: module.Seguranca })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then((module) => ({ default: module.Configuracoes })));
const Backup = lazy(() => import('./pages/Backup').then((module) => ({ default: module.Backup })));

function PageLoading() {
  // Carregamento visual enquanto uma tela lazy ainda nao chegou.
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  );
}

function page(Component: LazyExoticComponent<ComponentType>) {
  // Envolve paginas lazy com o mesmo fallback.
  return (
    <Suspense fallback={<PageLoading />}>
      <Component />
    </Suspense>
  );
}

function isAuthed() {
  // Confere token e usuario salvo antes de liberar area interna.
  return !!localStorage.getItem('token') && !!getStoredUser();
}
function getStoredUser() {
  // Se o localStorage estiver corrompido, limpa login antigo.
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
}
function hasRole(roles?: string[]) {
  // Valida se o usuario possui pelo menos um perfil aceito.
  if (!roles || roles.length === 0) return true;
  const user = getStoredUser();
  if (!user) return false;
  const perfis = user.perfis?.length ? user.perfis : [user.perfil];
  return perfis.some((perfil: string) => roles.includes(perfil));
}
function ProtectedRoute({ roles }: { roles?: string[] }) {
  // Redireciona quem nao esta logado ou nao tem permissao.
  if (!isAuthed()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  if (!hasRole(roles)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/login', element: page(Login) },
  { path: '/os-publica/:codigo', element: page(OSPublica) },
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    element: <ProtectedRoute />,
    children: [{ element: <MainLayout />, children: [
      { path: '/dashboard', element: page(Dashboard) },
      { path: '/clientes', element: page(Clientes) },
      { path: '/aparelhos', element: page(Aparelhos) },
      { path: '/ordens-servico', element: page(OrdensServico) },
      { path: '/nova-os', element: page(NovaOS) },
      { path: '/relatorios-clientes', element: page(RelatoriosClientes) },
      { path: '/pagamentos', element: page(Pagamentos) },
      { path: '/notificacoes', element: page(Notificacoes) },
      { path: '/entregas', element: page(Entregas) },
      { path: '/relatorios', element: page(Relatorios) },
      { path: '/historico-cliente/:id', element: page(HistoricoCliente) },
    ] }]
  },
  {
    element: <ProtectedRoute roles={['admin', 'atendente', 'tecnico', 'financeiro']} />,
    children: [{ element: <MainLayout />, children: [
      { path: '/ordem-servico/:id', element: page(DetalhesOS) },
    ] }]
  },
  {
    element: <ProtectedRoute roles={['admin', 'atendente', 'financeiro']} />,
    children: [{ element: <MainLayout />, children: [
      { path: '/estoque', element: page(Estoque) },
    ] }]
  },
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [{ element: <MainLayout />, children: [
      { path: '/usuarios', element: page(Usuarios) },
      { path: '/auditoria', element: page(Auditoria) },
      { path: '/seguranca', element: page(Seguranca) },
      { path: '/configuracoes', element: page(Configuracoes) },
      { path: '/backup', element: page(Backup) },
    ] }]
  }
]);

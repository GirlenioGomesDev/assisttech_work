import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Aparelhos } from './pages/Aparelhos';
import { OrdensServico } from './pages/OrdensServico';
import { NovaOS } from './pages/NovaOS';
import { DetalhesOS } from './pages/DetalhesOS';
import { Pagamentos } from './pages/Pagamentos';
import { Entregas } from './pages/Entregas';
import { Usuarios } from './pages/Usuarios';
import { Relatorios } from './pages/Relatorios';
import { HistoricoCliente } from './pages/HistoricoCliente';
import { MainLayout } from './layouts/MainLayout';

function isAuthed() {
  return !!localStorage.getItem('token');
}
function hasRole(roles?: string[]) {
  if (!roles || roles.length === 0) return true;
  const raw = localStorage.getItem('user');
  if (!raw) return false;
  const user = JSON.parse(raw);
  return roles.includes(user.perfil);
}
function ProtectedRoute({ roles }: { roles?: string[] }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  if (!hasRole(roles)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: '/login', Component: Login },
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    element: <ProtectedRoute />,
    children: [{ element: <MainLayout />, children: [
      { path: '/dashboard', Component: Dashboard },
      { path: '/clientes', Component: Clientes },
      { path: '/aparelhos', Component: Aparelhos },
      { path: '/ordens-servico', Component: OrdensServico },
      { path: '/nova-os', Component: NovaOS },
      { path: '/ordem-servico/:id', Component: DetalhesOS },
      { path: '/pagamentos', Component: Pagamentos },
      { path: '/entregas', Component: Entregas },
      { path: '/relatorios', Component: Relatorios },
      { path: '/historico-cliente/:id', Component: HistoricoCliente },
    ] }]
  },
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [{ element: <MainLayout />, children: [
      { path: '/usuarios', Component: Usuarios },
    ] }]
  }
]);

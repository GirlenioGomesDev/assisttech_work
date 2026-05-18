import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { apiRequest } from '../services/api';
import { AlertTriangle, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';

interface LoginLog {
  _id: string;
  login: string;
  sucesso: boolean;
  motivo?: string;
  ip?: string;
  user_agent?: string;
  usuario?: { nome?: string; perfis?: string[] };
  createdAt?: string;
}

interface Sessao {
  _id: string;
  id_sessao: string;
  status: 'ativa' | 'encerrada' | 'expirada' | 'revogada';
  usuario?: { nome?: string; email?: string; perfis?: string[] };
  ip?: string;
  user_agent?: string;
  ultimo_acesso?: string;
  expira_em?: string;
  createdAt?: string;
}

interface SegurancaResumo {
  sessoesAtivas: number;
  loginsOk24h: number;
  falhas24h: number;
  ultimosLogins: LoginLog[];
  sessoes: Sessao[];
}

const formatarData = (data?: string) => (data ? new Date(data).toLocaleString('pt-BR') : 'N/A');

const statusClass: Record<Sessao['status'], string> = {
  ativa: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  encerrada: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  expirada: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  revogada: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

export function Seguranca() {
  const [dados, setDados] = useState<SegurancaResumo | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      setLoading(true);
      setDados(await apiRequest('/seguranca/resumo'));
    } catch (error: any) {
      alert(error.message || 'Erro ao carregar seguranca');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const revogar = async (id: string) => {
    if (!confirm('Revogar esta sessao? O usuario precisara fazer login novamente.')) return;
    try {
      await apiRequest(`/seguranca/sessoes/${id}/revogar`, { method: 'POST' });
      await carregar();
    } catch (error: any) {
      alert(error.message || 'Erro ao revogar sessao');
    }
  };

  if (loading) return <Card><CardContent className="p-10 text-center text-gray-500">Carregando seguranca...</CardContent></Card>;
  if (!dados) return <Card><CardContent className="p-10 text-center text-gray-500">Nenhum dado encontrado</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-gray-100">Seguranca</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitoramento de acessos, tentativas de login e sessoes ativas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><ShieldCheck className="h-8 w-8 text-blue-600" /><div><p className="text-sm text-gray-500">Sessoes ativas</p><p className="text-2xl font-semibold">{dados.sessoesAtivas}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><CheckCircle className="h-8 w-8 text-emerald-600" /><div><p className="text-sm text-gray-500">Logins 24h</p><p className="text-2xl font-semibold">{dados.loginsOk24h}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><AlertTriangle className="h-8 w-8 text-red-600" /><div><p className="text-sm text-gray-500">Falhas 24h</p><p className="text-2xl font-semibold">{dados.falhas24h}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sessoes de usuario</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {dados.sessoes.length === 0 ? <p className="text-sm text-gray-500">Nenhuma sessao registrada</p> : dados.sessoes.map((sessao) => (
            <div key={sessao._id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusClass[sessao.status]}>{sessao.status}</Badge>
                  <strong>{sessao.usuario?.nome || 'Usuario'}</strong>
                  <span className="text-sm text-gray-500">{sessao.usuario?.email}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">IP: {sessao.ip || 'N/A'} | Ultimo acesso: {formatarData(sessao.ultimo_acesso)} | Expira: {formatarData(sessao.expira_em)}</p>
                <p className="line-clamp-1 text-xs text-gray-500">{sessao.user_agent || 'User-agent nao informado'}</p>
              </div>
              {sessao.status === 'ativa' && <Button size="sm" variant="outline" onClick={() => revogar(sessao._id)}><XCircle className="mr-2 h-4 w-4" />Revogar</Button>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tentativas de login</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {dados.ultimosLogins.length === 0 ? <p className="text-sm text-gray-500">Nenhuma tentativa registrada</p> : dados.ultimosLogins.map((log) => (
            <div key={log._id} className="flex flex-col gap-2 rounded-lg border p-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={log.sucesso ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{log.sucesso ? 'sucesso' : 'falha'}</Badge>
                  <strong>{log.login}</strong>
                  <span className="text-sm text-gray-500">{log.motivo}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Usuario: {log.usuario?.nome || 'N/A'} | IP: {log.ip || 'N/A'}</p>
              </div>
              <span className="text-sm text-gray-500">{formatarData(log.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

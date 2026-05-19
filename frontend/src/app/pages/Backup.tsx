// Tela para exportar e importar backup dos dados.
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { apiRequest } from '../services/api';
import { AlertTriangle, DatabaseBackup, Download, Upload } from 'lucide-react';

interface BackupResumo {
  collections: string[];
  contagem: Record<string, number>;
  gerado_em: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const labels: Record<string, string> = {
  clientes: 'Clientes',
  ordens_servico: 'Ordens de servico',
  estoque_itens: 'Itens de estoque',
  estoque_movimentacoes: 'Movimentacoes de estoque',
  financeiro_lancamentos: 'Lancamentos financeiros',
  configuracoes: 'Configuracoes',
  usuarios: 'Usuarios',
  notificacoes: 'Notificacoes',
  auditoria: 'Auditoria',
};

export function Backup() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [resumo, setResumo] = useState<BackupResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);

  const carregar = async () => {
    try {
      setLoading(true);
      setResumo(await apiRequest('/backup/resumo'));
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar resumo do backup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const exportar = async () => {
    try {
      setBusy(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/backup/exportar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const text = await response.text();
      if (!response.ok) {
        const error = JSON.parse(text || '{}');
        throw new Error(error.erro || 'Erro ao exportar backup');
      }
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assisttech-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Backup exportado com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar backup');
    } finally {
      setBusy(false);
    }
  };

  const importar = async () => {
    if (!arquivo) return toast.error('Selecione um arquivo de backup');
    if (confirmacao !== 'IMPORTAR') return toast.error('Digite IMPORTAR para confirmar');

    try {
      setBusy(true);
      const text = await arquivo.text();
      const data = JSON.parse(text);
      await apiRequest('/backup/importar', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Backup importado com sucesso');
      setArquivo(null);
      setConfirmacao('');
      if (inputRef.current) inputRef.current.value = '';
      await carregar();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar backup');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Card><CardContent className="p-10 text-center text-gray-500">Carregando backup...</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Backup</h1>
          <p className="text-gray-600 dark:text-gray-400">Exporte e restaure os dados principais do sistema em JSON.</p>
        </div>
        <Button onClick={exportar} disabled={busy}><Download className="mr-2 h-4 w-4" />Exportar backup</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(resumo?.collections || []).map((collection) => (
          <Card key={collection}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-gray-500">{labels[collection] || collection}</p>
                <p className="text-2xl font-semibold">{resumo?.contagem?.[collection] || 0}</p>
              </div>
              <DatabaseBackup className="h-7 w-7 text-blue-600" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Importar backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <p>A importacao funciona em modo mesclar: registros com o mesmo ID sao atualizados e registros novos sao inseridos. Faca uma exportacao antes de importar outro arquivo.</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label>Arquivo JSON</Label>
              <Input ref={inputRef} type="file" accept="application/json,.json" onChange={(event) => setArquivo(event.target.files?.[0] || null)} />
              {arquivo && <Badge className="mt-2 bg-blue-100 text-blue-800">{arquivo.name}</Badge>}
            </div>
            <div>
              <Label>Confirmacao</Label>
              <Input value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} placeholder="Digite IMPORTAR" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={importar} disabled={busy || !arquivo || confirmacao !== 'IMPORTAR'}>
              <Upload className="mr-2 h-4 w-4" />Importar arquivo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

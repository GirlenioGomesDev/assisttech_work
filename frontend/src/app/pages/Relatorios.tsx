import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, DollarSign, Wrench, TrendingUp } from 'lucide-react';
import { mockOrdensServico, statusLabels } from '../data/mockData';
import { AttachmentData, AttachmentInput } from '../components/AttachmentInput';

export function Relatorios() {
  const [anexosRelatorio, setAnexosRelatorio] = useState<AttachmentData[]>([]);

  // Dados para gráfico de serviços por status
  const servicosPorStatus = Object.entries(
    mockOrdensServico.reduce((acc, os) => {
      acc[os.status] = (acc[os.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels],
    value: count,
  }));

  // Dados para gráfico de defeitos mais comuns
  const defeitosMaisComuns = [
    { defeito: 'Não liga', quantidade: 5 },
    { defeito: 'Bateria viciada', quantidade: 4 },
    { defeito: 'Tela quebrada', quantidade: 3 },
    { defeito: 'Não carrega', quantidade: 3 },
    { defeito: 'Lentidão', quantidade: 2 },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#eab308', '#f97316', '#ec4899', '#10b981', '#6b7280', '#ef4444'];

  const totalServicos = mockOrdensServico.length;
  const servicosConcluidos = mockOrdensServico.filter(os => os.status === 'entregue').length;
  const faturamentoTotal = mockOrdensServico
    .filter(os => os.orcamento && os.status === 'entregue')
    .reduce((sum, os) => sum + (os.orcamento?.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Visualize estatísticas e métricas do sistema</p>
        </div>
        <Select defaultValue="mes">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Esta Semana</SelectItem>
            <SelectItem value="mes">Este Mês</SelectItem>
            <SelectItem value="ano">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anexos do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentInput value={anexosRelatorio} onChange={setAnexosRelatorio} />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Serviços</p>
                <p className="text-3xl mt-2">{totalServicos}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Concluídos</p>
                <p className="text-3xl mt-2">{servicosConcluidos}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturamento</p>
                <p className="text-2xl mt-2">R$ {faturamentoTotal.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ticket Médio</p>
                <p className="text-2xl mt-2">
                  R$ {servicosConcluidos > 0 ? (faturamentoTotal / servicosConcluidos).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Wrench className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serviços por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={servicosPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {servicosPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Defeitos Mais Comuns */}
        <Card>
          <CardHeader>
            <CardTitle>Defeitos Mais Comuns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={defeitosMaisComuns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="defeito" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aparelhos Mais Atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">Samsung Galaxy</span>
                <span className="text-sm font-semibold">8 serviços</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">iPhone</span>
                <span className="text-sm font-semibold">6 serviços</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">Dell Inspiron</span>
                <span className="text-sm font-semibold">4 serviços</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Técnicos com Mais Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">Carlos Oliveira</span>
                <span className="text-sm font-semibold">{mockOrdensServico.length} OS</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm">Ana Silva</span>
                <span className="text-sm font-semibold">0 OS</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

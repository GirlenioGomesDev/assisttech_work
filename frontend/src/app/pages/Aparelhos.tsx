// Tela para listar e filtrar aparelhos vinculados as ordens.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Smartphone, Laptop, Plus, FileText } from 'lucide-react';
import { apiRequest } from '../services/api';

interface OrdemServico {
  _id: string;
  id_os: string;
  cliente?: { nome?: string; telefone?: string };
  aparelho?: {
    id_aparelho?: string;
    tipo_aparelho?: string;
    marca?: string;
    modelo?: string;
    cor?: string;
    imei_ou_serial?: string;
    acessorios_entregues?: string;
    estado_fisico?: string;
  };
}

export function Aparelhos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/os');
        setOrdens(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        alert('Erro ao carregar aparelhos');
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const aparelhos = useMemo(() => {
    return ordens.filter((os) => os.aparelho?.marca || os.aparelho?.modelo);
  }, [ordens]);

  const filteredAparelhos = aparelhos.filter((os) => {
    const texto = [
      os.cliente?.nome,
      os.aparelho?.marca,
      os.aparelho?.modelo,
      os.aparelho?.imei_ou_serial,
      os.id_os,
    ]
      .join(' ')
      .toLowerCase();

    return texto.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Aparelhos</h1>
          <p className="text-gray-600">Todos os aparelhos cadastrados nas ordens de serviço</p>
        </div>
        <div className="flex gap-2">
          <Link to="/clientes"><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Novo cliente</Button></Link>
          <Link to="/nova-os"><Button><FileText className="h-4 w-4 mr-2" />Cadastrar aparelho via OS</Button></Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por marca, modelo, IMEI, cliente ou OS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-10 text-center text-gray-500">Carregando aparelhos...</CardContent></Card>
      ) : filteredAparelhos.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-gray-500">Nenhum aparelho encontrado</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAparelhos.map((os) => {
            const isCelular = os.aparelho?.tipo_aparelho === 'celular';
            const Icon = isCelular ? Smartphone : Laptop;

            return (
              <Link key={os._id} to={`/ordem-servico/${os._id}`}>
                <Card className="h-full hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <span>{os.aparelho?.marca || 'Sem marca'} {os.aparelho?.modelo || ''}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-700">
                    <p><strong>OS:</strong> {os.id_os}</p>
                    <p><strong>Cliente:</strong> {os.cliente?.nome || 'Não informado'}</p>
                    <p><strong>Tipo:</strong> {os.aparelho?.tipo_aparelho || 'Não informado'}</p>
                    <p><strong>Cor:</strong> {os.aparelho?.cor || 'Não informada'}</p>
                    <p><strong>IMEI / Serial:</strong> {os.aparelho?.imei_ou_serial || 'Não informado'}</p>
                    {os.aparelho?.acessorios_entregues && <p><strong>Acessórios:</strong> {os.aparelho.acessorios_entregues}</p>}
                    {os.aparelho?.estado_fisico && <p><strong>Estado físico:</strong> {os.aparelho.estado_fisico}</p>}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

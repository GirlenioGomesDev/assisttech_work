import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { apiRequest } from '../services/api';
import { FileText, Package, Search, User } from 'lucide-react';

interface ResultadoBusca {
  tipo: 'os' | 'cliente' | 'estoque';
  id: string;
  codigo?: string;
  titulo: string;
  subtitulo?: string;
  status?: string;
  destino: string;
}

const tipoConfig = {
  os: { label: 'OS', icon: FileText, className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' },
  cliente: { label: 'Cliente', icon: User, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  estoque: { label: 'Estoque', icon: Package, className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' },
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const termo = query.trim();
    if (termo.length < 2) {
      setResultados([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const data = await apiRequest(`/busca/global?q=${encodeURIComponent(termo)}`, { signal: controller.signal });
        setResultados(Array.isArray(data.resultados) ? data.resultados : []);
      } catch (error: any) {
        if (error.name !== 'AbortError') setResultados([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const agrupados = useMemo(() => ({
    os: resultados.filter((item) => item.tipo === 'os'),
    cliente: resultados.filter((item) => item.tipo === 'cliente'),
    estoque: resultados.filter((item) => item.tipo === 'estoque'),
  }), [resultados]);

  const abrir = (destino: string) => {
    setOpen(false);
    setQuery('');
    navigate(destino);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="hidden h-9 w-full max-w-md justify-start gap-2 text-gray-500 md:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar OS, cliente, telefone, IMEI...</span>
        <kbd className="rounded border px-1.5 py-0.5 text-xs">Ctrl K</kbd>
      </Button>
      <Button type="button" variant="outline" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Busca global">
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Busca global" description="Busque clientes, ordens de servico e itens de estoque">
        <CommandInput value={query} onValueChange={setQuery} placeholder="Digite nome, telefone, OS, IMEI, serial ou peca..." />
        <CommandList>
          {query.trim().length < 2 ? (
            <CommandEmpty>Digite pelo menos 2 caracteres para buscar.</CommandEmpty>
          ) : loading ? (
            <CommandEmpty>Buscando...</CommandEmpty>
          ) : resultados.length === 0 ? (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          ) : (
            <>
              {(['os', 'cliente', 'estoque'] as const).map((tipo) => {
                const items = agrupados[tipo];
                if (!items.length) return null;
                const config = tipoConfig[tipo];
                const Icon = config.icon;
                return (
                  <CommandGroup key={tipo} heading={config.label}>
                    {items.map((item) => {
                      const searchValue = [item.tipo, item.codigo, item.titulo, item.subtitulo, item.status].filter(Boolean).join(' ');
                      return (
                        <CommandItem key={`${item.tipo}-${item.id}`} value={searchValue} onSelect={() => abrir(item.destino)}>
                          <Icon className="h-4 w-4" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{item.titulo}</p>
                            {item.subtitulo && <p className="truncate text-xs text-gray-500">{item.subtitulo}</p>}
                          </div>
                          {item.codigo && <span className="text-xs text-gray-500">{item.codigo}</span>}
                          {item.status && <Badge className={config.className}>{item.status}</Badge>}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                );
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

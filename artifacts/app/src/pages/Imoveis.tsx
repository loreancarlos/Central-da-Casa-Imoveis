import { useState } from "react";
import { useListImoveis } from "@workspace/api-client-react";
import type { Imovel } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, List, BedDouble, Car, MapPin, Maximize2, ExternalLink } from "lucide-react";

function getPropertyImage(imovel: Imovel): string {
  return `https://picsum.photos/seed/imovel-${imovel.id}/640/360`;
}

function ImovelCard({ imovel }: { imovel: Imovel }) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={getPropertyImage(imovel)}
          alt={`${imovel.tipo} em ${imovel.bairro}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm border font-medium text-xs">
            {imovel.tipo}
          </Badge>
        </div>
        <div className="absolute bottom-3 right-3">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm border font-mono text-xs">
            {imovel.codigoExterno || `#${imovel.id}`}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="font-bold text-lg leading-tight">{formatCurrency(imovel.preco)}</p>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{imovel.bairro}, {imovel.cidade}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <BedDouble className="h-4 w-4" />
            <span>{imovel.quartos}</span>
          </div>
          <div className="flex items-center gap-1">
            <Car className="h-4 w-4" />
            <span>{imovel.vagas}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize2 className="h-4 w-4" />
            <span>{imovel.area}m²</span>
          </div>
        </div>
        {imovel.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">{imovel.descricao}</p>
        )}
      </CardContent>
    </Card>
  );
}

const QUARTOS_OPTIONS = ["1", "2", "3", "4", "5+"];
const VAGAS_OPTIONS = ["0", "1", "2", "3", "4+"];

export default function Imoveis() {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"gallery" | "table">("gallery");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [tipo, setTipo] = useState("");
  const [quartos, setQuartos] = useState("");
  const [vagas, setVagas] = useState("");

  const parseMin = (val: string) => {
    if (!val) return undefined;
    const n = parseInt(val.replace("+", ""), 10);
    return isNaN(n) ? undefined : n;
  };

  const { data, isLoading } = useListImoveis({
    page,
    limit: view === "gallery" ? 12 : 10,
    cidade: cidade || undefined,
    tipo: tipo || undefined,
    bairro: bairro || undefined,
    quartos: parseMin(quartos),
    vagas: parseMin(vagas),
  });

  const hasResults = (data?.data?.length ?? 0) > 0;
  const limit = view === "gallery" ? 12 : 10;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Imóveis</h1>
          <p className="text-muted-foreground mt-2">Catálogo de propriedades disponíveis.</p>
        </div>
        <div className="flex items-center border rounded-md overflow-hidden">
          <button
            onClick={() => setView("gallery")}
            className={`p-2 transition-colors ${view === "gallery" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            title="Modo galeria"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-2 transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            title="Modo tabela"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Cidade"
          value={cidade}
          onChange={e => { setCidade(e.target.value); setPage(1); }}
          className="w-40"
        />
        <Input
          placeholder="Bairro"
          value={bairro}
          onChange={e => { setBairro(e.target.value); setPage(1); }}
          className="w-40"
        />
        <Select value={tipo} onValueChange={v => { setTipo(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo de imóvel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="Casa">Casa</SelectItem>
            <SelectItem value="Apartamento">Apartamento</SelectItem>
          </SelectContent>
        </Select>
        <Select value={quartos} onValueChange={v => { setQuartos(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Nº Quartos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Qualquer nº quartos</SelectItem>
            {QUARTOS_OPTIONS.map(q => (
              <SelectItem key={q} value={q}>{q} quarto{q !== "1" ? "s" : ""} ou mais</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vagas} onValueChange={v => { setVagas(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Nº Garagem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Qualquer nº vagas</SelectItem>
            {VAGAS_OPTIONS.map(v => (
              <SelectItem key={v} value={v}>{v === "0" ? "Sem garagem" : `${v} vaga${v !== "1" ? "s" : ""} ou mais`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(cidade || bairro || tipo || quartos || vagas) && (
          <Button variant="ghost" size="sm" onClick={() => { setCidade(""); setBairro(""); setTipo(""); setQuartos(""); setVagas(""); setPage(1); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        view === "gallery" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Skeleton className="h-64 w-full" />
        )
      ) : !hasResults ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg">
          Nenhum imóvel encontrado com esses filtros.
        </div>
      ) : view === "gallery" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data?.data.map(imovel => (
            <ImovelCard key={imovel.id} imovel={imovel} />
          ))}
        </div>
      ) : (
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Características</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Anúncio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((imovel) => (
                <TableRow key={imovel.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">{imovel.codigoExterno || imovel.id}</TableCell>
                  <TableCell className="font-medium">{imovel.tipo}</TableCell>
                  <TableCell>{imovel.bairro}, {imovel.cidade}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(imovel.preco)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>{imovel.area}m²</span>•
                      <span>{imovel.quartos} quartos</span>•
                      <span>{imovel.vagas} vagas</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{imovel.fonte}</Badge></TableCell>
                  <TableCell>
                    {imovel.urlOriginal ? (
                      <a
                        href={imovel.urlOriginal}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        title={imovel.urlOriginal}
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Ver anúncio</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
        <Button variant="outline" disabled={!data || data.data.length < limit} onClick={() => setPage(p => p + 1)}>Próxima</Button>
      </div>
    </div>
  );
}

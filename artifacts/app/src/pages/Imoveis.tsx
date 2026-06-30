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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LayoutGrid, List, BedDouble, Car, MapPin, Maximize2, ExternalLink,
  Bath, ChevronLeft, ChevronRight, ImageOff, Info,
} from "lucide-react";

function getFallbackImage(imovel: Imovel): string {
  return `https://picsum.photos/seed/imovel-${imovel.id}/640/360`;
}

function getMainPhoto(imovel: Imovel): string {
  return imovel.fotos && imovel.fotos.length > 0 ? imovel.fotos[0] : getFallbackImage(imovel);
}

function PhotoGallery({ fotos, title }: { fotos: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  if (fotos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg text-muted-foreground gap-2">
        <ImageOff className="h-6 w-6" />
        <span className="text-sm">Sem fotos disponíveis</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden bg-black h-72">
        <img
          src={fotos[idx]}
          alt={`${title} - foto ${idx + 1}`}
          className="w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/640/360?grayscale"; }}
        />
        {fotos.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + fotos.length) % fotos.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % fotos.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              {idx + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>
      {fotos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {fotos.map((f, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors ${i === idx ? "border-primary" : "border-transparent"}`}
            >
              <img
                src={f}
                alt={`thumb ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImovelDetailModal({ imovel, onClose }: { imovel: Imovel; onClose: () => void }) {
  const titulo = `${imovel.tipo} — ${imovel.bairro}, ${imovel.cidade}`;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg leading-snug">{titulo}</DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes, fotos e informações do imóvel
          </DialogDescription>
        </DialogHeader>

        <PhotoGallery fotos={imovel.fotos ?? []} title={titulo} />

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="col-span-2">
            <p className="text-2xl font-bold">{formatCurrency(imovel.preco)}</p>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{imovel.bairro}, {imovel.cidade}</span>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-3 text-center">
              <BedDouble className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-lg font-bold">{imovel.quartos || "—"}</span>
              <span className="text-xs text-muted-foreground">Quartos</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-3 text-center">
              <Bath className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-lg font-bold">{imovel.banheiros || "—"}</span>
              <span className="text-xs text-muted-foreground">Banheiros</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-3 text-center">
              <Car className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-lg font-bold">{imovel.vagas ?? "—"}</span>
              <span className="text-xs text-muted-foreground">Vagas</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-3 text-center">
              <Maximize2 className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-lg font-bold">{imovel.area > 0 ? imovel.area : "—"}</span>
              <span className="text-xs text-muted-foreground">m²</span>
            </div>
          </div>

          {imovel.descricao && (
            <div className="col-span-2">
              <p className="text-sm font-medium mb-1">Descrição</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{imovel.descricao}</p>
            </div>
          )}

          <div className="col-span-2 flex items-center justify-between pt-2 border-t">
            <Badge variant="secondary">{imovel.fonte}</Badge>
            {imovel.urlOriginal && (
              <a
                href={imovel.urlOriginal}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Ver anúncio original
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImovelCard({ imovel, onClick }: { imovel: Imovel; onClick: () => void }) {
  return (
    <Card
      className="overflow-hidden group hover:shadow-lg transition-all duration-300 border cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={getMainPhoto(imovel)}
          alt={`${imovel.tipo} em ${imovel.bairro}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImage(imovel); }}
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm border font-medium text-xs">
            {imovel.tipo}
          </Badge>
        </div>
        {(imovel.fotos?.length ?? 0) > 0 && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-background/90 text-foreground backdrop-blur-sm border font-mono text-xs">
              📷 {imovel.fotos!.length}
            </Badge>
          </div>
        )}
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
          <p className="text-xs text-muted-foreground/70 mt-0.5">{imovel.fonte}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <BedDouble className="h-4 w-4" />
            <span>{imovel.quartos}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{imovel.banheiros}</span>
          </div>
          <div className="flex items-center gap-1">
            <Car className="h-4 w-4" />
            <span>{imovel.vagas}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize2 className="h-4 w-4" />
            <span>{imovel.area > 0 ? `${imovel.area}m²` : "—"}</span>
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
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [selected, setSelected] = useState<Imovel | null>(null);

  const parseMin = (val: string) => {
    if (!val) return undefined;
    const n = parseInt(val.replace("+", ""), 10);
    return isNaN(n) ? undefined : n;
  };

  const parsePrice = (val: string) => {
    const n = parseFloat(val.replace(/\./g, "").replace(",", "."));
    return isNaN(n) || n <= 0 ? undefined : n;
  };

  const { data, isLoading } = useListImoveis({
    page,
    limit: view === "gallery" ? 12 : 10,
    cidade: cidade || undefined,
    tipo: tipo || undefined,
    bairro: bairro || undefined,
    quartos: parseMin(quartos),
    vagas: parseMin(vagas),
    precoMin: parsePrice(precoMin),
    precoMax: parsePrice(precoMax),
  });

  const hasResults = (data?.data?.length ?? 0) > 0;
  const limit = view === "gallery" ? 12 : 10;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {selected && <ImovelDetailModal imovel={selected} onClose={() => setSelected(null)} />}

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
        <Input
          placeholder="Preço mín. (R$)"
          value={precoMin}
          onChange={e => { setPrecoMin(e.target.value); setPage(1); }}
          className="w-36"
          type="number"
          min={0}
        />
        <Input
          placeholder="Preço máx. (R$)"
          value={precoMax}
          onChange={e => { setPrecoMax(e.target.value); setPage(1); }}
          className="w-36"
          type="number"
          min={0}
        />
        {(cidade || bairro || tipo || quartos || vagas || precoMin || precoMax) && (
          <Button variant="ghost" size="sm" onClick={() => { setCidade(""); setBairro(""); setTipo(""); setQuartos(""); setVagas(""); setPrecoMin(""); setPrecoMax(""); setPage(1); }}>
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
            <ImovelCard key={imovel.id} imovel={imovel} onClick={() => setSelected(imovel)} />
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
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((imovel) => (
                <TableRow
                  key={imovel.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelected(imovel)}
                >
                  <TableCell className="font-mono text-xs">{imovel.codigoExterno || imovel.id}</TableCell>
                  <TableCell className="font-medium">{imovel.tipo}</TableCell>
                  <TableCell>{imovel.bairro}, {imovel.cidade}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(imovel.preco)}</TableCell>
                  <TableCell>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      {imovel.area > 0 && <span>{imovel.area}m²</span>}
                      {imovel.quartos > 0 && <span>{imovel.quartos} qts</span>}
                      {imovel.banheiros > 0 && <span>{imovel.banheiros} ban</span>}
                      {imovel.vagas > 0 && <span>{imovel.vagas} vg</span>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{imovel.fonte}</Badge></TableCell>
                  <TableCell>
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(imovel); }}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      title="Ver detalhes"
                    >
                      <Info className="h-4 w-4" />
                      {(imovel.fotos?.length ?? 0) > 0 && (
                        <span className="text-xs">📷 {imovel.fotos!.length}</span>
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
        <Button variant="outline" disabled={!data || (data.data?.length ?? 0) < limit} onClick={() => setPage(p => p + 1)}>Próxima</Button>
      </div>
    </div>
  );
}

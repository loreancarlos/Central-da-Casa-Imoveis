import { useState } from "react";
import { useListClientes, useGetMatchesForCliente, useUpdateMatchStatus, getGetMatchesForClienteQueryKey } from "@workspace/api-client-react";
import type { MatchResult } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List, BedDouble, Car, Maximize2, MapPin, X } from "lucide-react";

function getPropertyImage(id: number): string {
  return `https://picsum.photos/seed/imovel-${id}/640/360`;
}

const STATUS_CONFIG = {
  NOVO:        { label: "Novo",        className: "bg-blue-500 hover:bg-blue-600 text-white" },
  VISUALIZADO: { label: "Visualizado", className: "bg-secondary text-secondary-foreground" },
  INTERESSADO: { label: "Interessado", className: "bg-green-500 hover:bg-green-600 text-white" },
  DESCARTADO:  { label: "Descartado",  className: "bg-destructive text-destructive-foreground" },
} as const;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return cfg
    ? <Badge className={cfg.className}>{cfg.label}</Badge>
    : <Badge variant="outline">{status}</Badge>;
}

function ScoreBadge({ score }: { score: number }) {
  const pct = score;
  const color =
    pct >= 80 ? "bg-green-500 text-white" :
    pct >= 60 ? "bg-yellow-500 text-white" :
                "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${color}`}>
      {pct.toFixed(0)}%
    </span>
  );
}

function MatchCard({ match, onClick, onStatusChange }: {
  match: MatchResult;
  onClick: () => void;
  onStatusChange: (status: "NOVO" | "VISUALIZADO" | "INTERESSADO" | "DESCARTADO") => void;
}) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border">
      <div
        className="relative h-44 overflow-hidden bg-muted cursor-pointer"
        onClick={onClick}
      >
        <img
          src={getPropertyImage(match.imovel.id)}
          alt={`${match.imovel.tipo} em ${match.imovel.bairro}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <ScoreBadge score={match.score} />
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={match.status} />
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm border text-xs font-medium">
            {match.imovel.tipo}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="cursor-pointer" onClick={onClick}>
          <p className="font-bold text-lg leading-tight">{formatCurrency(match.imovel.preco)}</p>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{match.imovel.bairro}, {match.imovel.cidade}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <BedDouble className="h-4 w-4" />
            <span>{match.imovel.quartos}</span>
          </div>
          <div className="flex items-center gap-1">
            <Car className="h-4 w-4" />
            <span>{match.imovel.vagas}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize2 className="h-4 w-4" />
            <span>{match.imovel.area}m²</span>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Select value={match.status} onValueChange={(val: any) => onStatusChange(val)}>
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOVO">Novo</SelectItem>
              <SelectItem value="VISUALIZADO">Visualizado</SelectItem>
              <SelectItem value="INTERESSADO">Interessado</SelectItem>
              <SelectItem value="DESCARTADO">Descartado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Matches() {
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [view, setView] = useState<"gallery" | "table">("gallery");
  const [search, setSearch] = useState("");

  const { data: clientesData } = useListClientes({ limit: 100 });

  const { data: matches, isLoading } = useGetMatchesForCliente(selectedClienteId as number, {
    query: { enabled: !!selectedClienteId }
  });

  const updateMatch = useUpdateMatchStatus();
  const queryClient = useQueryClient();

  const handleStatusChange = (matchId: number, status: "NOVO" | "VISUALIZADO" | "INTERESSADO" | "DESCARTADO") => {
    updateMatch.mutate({ id: matchId, data: { status } }, {
      onSuccess: () => {
        if (selectedClienteId) {
          queryClient.invalidateQueries({ queryKey: getGetMatchesForClienteQueryKey(selectedClienteId) });
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground mt-2">Encontre os melhores imóveis para seus clientes.</p>
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

      <div className="w-full max-w-md space-y-1">
        <div className="relative">
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedClienteId(null);
            }}
          />
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => { setSearch(""); setSelectedClienteId(null); }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {search && !selectedClienteId && (() => {
          const filtered = clientesData?.data.filter((c) =>
            c.nome.toLowerCase().includes(search.toLowerCase())
          ) ?? [];
          return (
            <div className="border rounded-md bg-popover shadow-md overflow-hidden">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => { setSelectedClienteId(c.id); setSearch(c.nome); }}
                  >
                    {c.nome}
                  </button>
                ))
              )}
            </div>
          );
        })()}
      </div>

      {selectedClienteId && (
        isLoading ? (
          view === "gallery" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-44 w-full rounded-none" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Skeleton className="h-64 w-full" />
          )
        ) : !matches?.length ? (
          <div className="text-center py-16 text-muted-foreground border rounded-lg">
            Nenhum match encontrado para este cliente.
          </div>
        ) : view === "gallery" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {matches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                onClick={() => setSelectedMatch(match)}
                onStatusChange={(status) => handleStatusChange(match.matchId, status)}
              />
            ))}
          </div>
        ) : (
          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Alterar Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.matchId} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedMatch(match)}>
                    <TableCell>
                      <ScoreBadge score={match.score} />
                    </TableCell>
                    <TableCell><StatusBadge status={match.status} /></TableCell>
                    <TableCell className="font-medium">{match.imovel.tipo} ({match.imovel.quartos} qts)</TableCell>
                    <TableCell>{match.imovel.bairro}, {match.imovel.cidade}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(match.imovel.preco)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Select value={match.status} onValueChange={(val: any) => handleStatusChange(match.matchId, val)}>
                        <SelectTrigger className="h-8 w-36 ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NOVO">Novo</SelectItem>
                          <SelectItem value="VISUALIZADO">Visualizado</SelectItem>
                          <SelectItem value="INTERESSADO">Interessado</SelectItem>
                          <SelectItem value="DESCARTADO">Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}

      {selectedMatch && (
        <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
          <DialogContent className="max-w-xl overflow-hidden p-0">
            <div className="relative h-52 overflow-hidden">
              <img
                src={getPropertyImage(selectedMatch.imovel.id)}
                alt={selectedMatch.imovel.tipo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <ScoreBadge score={selectedMatch.score} />
                <StatusBadge status={selectedMatch.status} />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle>{selectedMatch.imovel.tipo} — {selectedMatch.imovel.bairro}, {selectedMatch.imovel.cidade}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium">Preço</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedMatch.imovel.preco)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Área</p>
                  <p className="text-lg">{selectedMatch.imovel.area}m²</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Quartos</p>
                  <p className="text-lg">{selectedMatch.imovel.quartos}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Vagas</p>
                  <p className="text-lg">{selectedMatch.imovel.vagas}</p>
                </div>
                {selectedMatch.imovel.descricao && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground font-medium">Descrição</p>
                    <p className="mt-1 text-muted-foreground">{selectedMatch.imovel.descricao}</p>
                  </div>
                )}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <p className="text-muted-foreground font-medium text-sm mb-2">Alterar status</p>
                <Select
                  value={selectedMatch.status}
                  onValueChange={(val: any) => {
                    handleStatusChange(selectedMatch.matchId, val);
                    setSelectedMatch({ ...selectedMatch, status: val });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOVO">Novo</SelectItem>
                    <SelectItem value="VISUALIZADO">Visualizado</SelectItem>
                    <SelectItem value="INTERESSADO">Interessado</SelectItem>
                    <SelectItem value="DESCARTADO">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedMatch.imovel.urlOriginal && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={selectedMatch.imovel.urlOriginal} target="_blank" rel="noreferrer">Ver Anúncio Original</a>
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

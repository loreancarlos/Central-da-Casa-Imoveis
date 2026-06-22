import { useState } from "react";
import { useListClientes, useGetMatchesForCliente, useUpdateMatchStatus, getGetMatchesForClienteQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Matches() {
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NOVO": return <Badge className="bg-blue-500 hover:bg-blue-600">Novo</Badge>;
      case "VISUALIZADO": return <Badge variant="secondary">Visualizado</Badge>;
      case "INTERESSADO": return <Badge className="bg-green-500 hover:bg-green-600">Interessado</Badge>;
      case "DESCARTADO": return <Badge variant="destructive">Descartado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
        <p className="text-muted-foreground mt-2">Encontre os melhores imóveis para seus clientes.</p>
      </div>

      <div className="w-full max-w-md">
        <Select onValueChange={(val) => setSelectedClienteId(Number(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente..." />
          </SelectTrigger>
          <SelectContent>
            {clientesData?.data.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClienteId && (
        <div className="border rounded-md bg-card mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Buscando matches...</TableCell>
                </TableRow>
              ) : matches?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum match encontrado para este cliente.</TableCell>
                </TableRow>
              ) : (
                matches?.map((match) => (
                  <TableRow key={match.matchId} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedMatch(match)}>
                    <TableCell>
                      <Badge variant="outline" className="font-bold font-mono">
                        {(match.score * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(match.status)}</TableCell>
                    <TableCell className="font-medium">{match.imovel.tipo} ({match.imovel.quartos} qts)</TableCell>
                    <TableCell>{match.imovel.bairro}, {match.imovel.cidade}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(match.imovel.preco)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Select value={match.status} onValueChange={(val: any) => handleStatusChange(match.matchId, val)}>
                        <SelectTrigger className="h-8 w-32 ml-auto">
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedMatch && (
        <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Match</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-lg px-4 py-1">{(selectedMatch.score * 100).toFixed(0)}% Match</Badge>
                {getStatusBadge(selectedMatch.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground">Tipo</p>
                  <p className="text-lg">{selectedMatch.imovel.tipo}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Preço</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedMatch.imovel.preco)}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Localização</p>
                  <p>{selectedMatch.imovel.bairro}, {selectedMatch.imovel.cidade}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Características</p>
                  <p>{selectedMatch.imovel.area}m² • {selectedMatch.imovel.quartos} quartos • {selectedMatch.imovel.vagas} vagas</p>
                </div>
                {selectedMatch.imovel.descricao && (
                  <div className="col-span-2">
                    <p className="font-semibold text-muted-foreground">Descrição</p>
                    <p className="mt-1 text-muted-foreground">{selectedMatch.imovel.descricao}</p>
                  </div>
                )}
                {selectedMatch.imovel.urlOriginal && (
                  <div className="col-span-2 mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <a href={selectedMatch.imovel.urlOriginal} target="_blank" rel="noreferrer">Ver Anúncio Original</a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

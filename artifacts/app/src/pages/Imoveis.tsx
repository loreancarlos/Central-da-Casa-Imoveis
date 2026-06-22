import { useState } from "react";
import { useListImoveis } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Imoveis() {
  const [page, setPage] = useState(1);
  const [cidade, setCidade] = useState("");
  const [tipo, setTipo] = useState("");
  const [bairro, setBairro] = useState("");

  const { data, isLoading } = useListImoveis({ 
    page, 
    limit: 10,
    cidade: cidade || undefined,
    tipo: tipo || undefined,
    bairro: bairro || undefined,
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Imóveis</h1>
        <p className="text-muted-foreground mt-2">Catálogo de propriedades disponíveis.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} className="w-48" />
        <Input placeholder="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} className="w-48" />
        <Input placeholder="Tipo" value={tipo} onChange={e => setTipo(e.target.value)} className="w-48" />
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8"><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum imóvel encontrado.</TableCell>
              </TableRow>
            ) : (
              data?.data.map((imovel) => (
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
        <Button variant="outline" disabled={!data || data.data.length < 10} onClick={() => setPage(p => p + 1)}>Próxima</Button>
      </div>
    </div>
  );
}

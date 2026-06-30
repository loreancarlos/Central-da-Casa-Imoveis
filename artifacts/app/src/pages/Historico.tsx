import { useListImportacoes } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "CONCLUIDO")
    return <Badge className="bg-green-500 text-white hover:bg-green-600">Concluído</Badge>;
  if (status === "ERRO")
    return <Badge variant="destructive">Erro</Badge>;
  return <Badge variant="secondary">Executando</Badge>;
}

export default function Historico() {
  const { data: historico, isLoading } = useListImportacoes();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Importações</h1>
        <p className="text-muted-foreground mt-2">
          Registro de todas as execuções de conectores.
        </p>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fonte</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead className="text-center">Importados</TableHead>
              <TableHead className="text-center">Atualizados</TableHead>
              <TableHead className="text-center">Ignorados</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ))
            ) : !Array.isArray(historico) || historico.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhuma importação executada ainda.
                </TableCell>
              </TableRow>
            ) : (
              historico.map((h) => (
                <TableRow key={h.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{h.fonte}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(h.inicioExecucao)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(h.fimExecucao)}</TableCell>
                  <TableCell className="text-center font-semibold text-green-600">{h.totalImportados}</TableCell>
                  <TableCell className="text-center font-semibold text-blue-600">{h.totalAtualizados}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{h.totalIgnorados}</TableCell>
                  <TableCell><StatusBadge status={h.status} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import {
  useListConnectors,
  useRunConnectorImport,
  getListImportacoesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Plug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportProgress {
  current: number;
  total: number;
  running: boolean;
}

function useImportProgress(nome: string | null, enabled: boolean) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !nome) {
      setProgress(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/connectors/${encodeURIComponent(nome)}/progresso`);
        if (res.ok) {
          const data: ImportProgress = await res.json();
          setProgress(data);
        }
      } catch {
        // ignore poll errors
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 600);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [nome, enabled]);

  return progress;
}

export default function Conectores() {
  const queryClient = useQueryClient();
  const { data: connectors, isLoading } = useListConnectors();
  const runImport = useRunConnectorImport();
  const { toast } = useToast();
  const [resultModal, setResultModal] = useState<{
    nome: string;
    importados: number;
    atualizados: number;
    ignorados: number;
  } | null>(null);
  const [runningNome, setRunningNome] = useState<string | null>(null);

  const progress = useImportProgress(runningNome, !!runningNome);

  const handleImport = (nome: string) => {
    setRunningNome(nome);
    runImport.mutate(
      { nome },
      {
        onSuccess: (data) => {
          setRunningNome(null);
          setResultModal({ nome, ...data });
          queryClient.invalidateQueries({ queryKey: getListImportacoesQueryKey() });
        },
        onError: () => {
          setRunningNome(null);
          toast({
            title: "Erro na importação",
            description: `Falha ao executar o conector ${nome}.`,
            variant: "destructive",
          });
        },
      }
    );
  };

  const getButtonLabel = (nome: string) => {
    if (runningNome !== nome) return "Executar Importação";
    if (progress && progress.total > 0) {
      return `Importando... (${progress.current}/${progress.total})`;
    }
    return "Importando...";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conectores</h1>
        <p className="text-muted-foreground mt-2">
          Conectores registrados para importação de imóveis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-28 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))
        ) : !Array.isArray(connectors) || connectors.length === 0 ? (
          <p className="text-muted-foreground col-span-full py-10 text-center">
            Nenhum conector registrado.
          </p>
        ) : (
          connectors.map((connector) => (
            <Card key={connector.nome} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plug className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{connector.nome}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">Genérico</Badge>
                  <Badge className="bg-green-500 text-white hover:bg-green-600">Ativo</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleImport(connector.nome)}
                  disabled={runningNome === connector.nome}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {getButtonLabel(connector.nome)}
                </Button>
                {runningNome === connector.nome && progress && progress.total > 0 && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!resultModal} onOpenChange={(open) => !open && setResultModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Importação concluída — {resultModal?.nome}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{resultModal?.importados}</p>
              <p className="text-sm text-muted-foreground mt-1">Importados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{resultModal?.atualizados}</p>
              <p className="text-sm text-muted-foreground mt-1">Atualizados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">{resultModal?.ignorados}</p>
              <p className="text-sm text-muted-foreground mt-1">Ignorados</p>
            </div>
          </div>
          <Button className="w-full" onClick={() => setResultModal(null)}>Fechar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import {
  useListFontes,
  useCreateFonte,
  useUpdateFonte,
  useDeleteFonte,
  getListFontesQueryKey,
} from "@workspace/api-client-react";
import type { FonteImportacao } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

type FormState = {
  nome: string;
  url: string;
  ativo: boolean;
};

const emptyForm = (): FormState => ({ nome: "", url: "", ativo: true });

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Fontes() {
  const queryClient = useQueryClient();
  const { data: fontes, isLoading } = useListFontes();

  const createFonte = useCreateFonte();
  const updateFonte = useUpdateFonte();
  const deleteFonte = useDeleteFonte();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<FonteImportacao | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListFontesQueryKey() });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (f: FonteImportacao) => {
    setEditingId(f.id);
    setForm({ nome: f.nome, url: f.url, ativo: f.ativo });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.nome.trim() || !form.url.trim()) return;

    if (editingId != null) {
      updateFonte.mutate(
        { id: editingId, data: form },
        { onSuccess: () => { invalidate(); setModalOpen(false); } }
      );
    } else {
      createFonte.mutate(
        { data: form },
        { onSuccess: () => { invalidate(); setModalOpen(false); } }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteFonte.mutate(
      { id: deleteTarget.id },
      { onSuccess: () => { invalidate(); setDeleteTarget(null); } }
    );
  };

  const isPending = createFonte.isPending || updateFonte.isPending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fontes de Importação</h1>
          <p className="text-muted-foreground mt-2">
            Imobiliárias parceiras configuradas para importação de imóveis.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fonte
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Ativa</TableHead>
              <TableHead>Última Execução</TableHead>
              <TableHead>Último Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ))
            ) : !Array.isArray(fontes) || fontes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhuma fonte cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              fontes.map((fonte) => (
                <TableRow key={fonte.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{fonte.nome}</TableCell>
                  <TableCell>
                    <a
                      href={fonte.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {fonte.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell>
                    {fonte.ativo ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">Ativa</Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(fonte.ultimaExecucao)}
                  </TableCell>
                  <TableCell>
                    {fonte.ultimoStatus ? (
                      <Badge variant="outline" className="text-xs font-mono">
                        {fonte.ultimoStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(fonte)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(fonte)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Editar Fonte" : "Nova Fonte"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Ex: Helena Imóveis"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://www.exemplo.com.br"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
              />
              <Label htmlFor="ativo">Fonte ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isPending || !form.nome.trim() || !form.url.trim()}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fonte</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

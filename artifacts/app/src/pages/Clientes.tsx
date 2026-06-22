import { useState } from "react";
import { useListClientes, getListClientesQueryKey, useCreateCliente, useUpdateCliente, useDeleteCliente } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListClientes({ search, page, limit: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
        }
      });
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      nome: formData.get("nome") as string,
      telefone: formData.get("telefone") as string,
      tipoImovelDesejado: formData.get("tipo") as string,
      cidade: formData.get("cidade") as string,
      bairroPreferido: formData.get("bairro") as string || null,
      precoMinimo: Number(formData.get("precoMin")),
      precoMaximo: Number(formData.get("precoMax")),
      quartosMinimos: Number(formData.get("quartos")),
      observacoes: formData.get("obs") as string || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
        }
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-2">Gerencie sua carteira de compradores.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingId(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" name="telefone" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Imóvel</Label>
                <Input id="tipo" name="tipo" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" name="cidade" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro Preferido</Label>
                <Input id="bairro" name="bairro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quartos">Quartos Mínimos</Label>
                <Input id="quartos" name="quartos" type="number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoMin">Preço Mínimo</Label>
                <Input id="precoMin" name="precoMin" type="number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precoMax">Preço Máximo</Label>
                <Input id="precoMax" name="precoMax" type="number" required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="obs">Observações</Label>
                <Input id="obs" name="obs" />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar clientes..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Desejo</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8"><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</TableCell>
              </TableRow>
            ) : (
              data?.data.map((cliente) => (
                <TableRow key={cliente.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{cliente.telefone}</TableCell>
                  <TableCell>{cliente.tipoImovelDesejado} ({cliente.quartosMinimos}+ quartos)</TableCell>
                  <TableCell>{cliente.cidade} {cliente.bairroPreferido && `- ${cliente.bairroPreferido}`}</TableCell>
                  <TableCell>{formatCurrency(cliente.precoMinimo)} - {formatCurrency(cliente.precoMaximo)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(cliente.id); setIsModalOpen(true); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cliente.id)}>
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
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
        <Button variant="outline" disabled={!data || data.data.length < 10} onClick={() => setPage(p => p + 1)}>Próxima</Button>
      </div>
    </div>
  );
}

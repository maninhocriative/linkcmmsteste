import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Plus,
  Package,
  Edit,
  Trash2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { PartCatalog } from '@/types';

const PartsCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState<PartCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartCatalog | null>(null);
  const [deletePartId, setDeletePartId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    codigo_interno: '',
    codigo_fabricante: '',
    categoria: '',
    fornecedor_padrao: '',
    valor_medio: 0,
    prazo_medio_entrega: 0,
    estoque_atual: 0,
    estoque_minimo: 0,
    unidade_medida: 'UN',
    observacoes: '',
  });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('parts_catalog')
      .select('*')
      .eq('status', 'ativo')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar peças');
      console.error(error);
    } else {
      setParts(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      codigo_interno: '',
      codigo_fabricante: '',
      categoria: '',
      fornecedor_padrao: '',
      valor_medio: 0,
      prazo_medio_entrega: 0,
      estoque_atual: 0,
      estoque_minimo: 0,
      unidade_medida: 'UN',
      observacoes: '',
    });
    setEditingPart(null);
  };

  const handleOpenDialog = (part?: PartCatalog) => {
    if (part) {
      setEditingPart(part);
      setFormData({
        nome: part.nome,
        codigo_interno: part.codigo_interno || '',
        codigo_fabricante: part.codigo_fabricante || '',
        categoria: part.categoria || '',
        fornecedor_padrao: part.fornecedor_padrao || '',
        valor_medio: part.valor_medio,
        prazo_medio_entrega: part.prazo_medio_entrega,
        estoque_atual: part.estoque_atual,
        estoque_minimo: part.estoque_minimo,
        unidade_medida: part.unidade_medida,
        observacoes: part.observacoes || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome da peça é obrigatório');
      return;
    }

    if (editingPart) {
      const { error } = await supabase
        .from('parts_catalog')
        .update(formData)
        .eq('id', editingPart.id);

      if (error) {
        toast.error('Erro ao atualizar peça');
        console.error(error);
      } else {
        toast.success('Peça atualizada com sucesso!');
        fetchParts();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('parts_catalog')
        .insert([formData]);

      if (error) {
        toast.error('Erro ao cadastrar peça');
        console.error(error);
      } else {
        toast.success('Peça cadastrada com sucesso!');
        fetchParts();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async () => {
    if (!deletePartId) return;

    const { error } = await supabase
      .from('parts_catalog')
      .update({ status: 'inativo' })
      .eq('id', deletePartId);

    if (error) {
      toast.error('Erro ao excluir peça');
      console.error(error);
    } else {
      toast.success('Peça removida com sucesso!');
      fetchParts();
    }
    setDeletePartId(null);
  };

  const filteredParts = parts.filter(
    (part) =>
      part.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockParts = parts.filter((p) => p.estoque_atual <= p.estoque_minimo);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 pb-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Cadastro de Peças
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie o catálogo de peças e estoque
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Peça
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingPart ? 'Editar Peça' : 'Nova Peça'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados da peça
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Peça *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Rolamento 6205"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="codigo_interno">Código Interno</Label>
                    <Input
                      id="codigo_interno"
                      value={formData.codigo_interno}
                      onChange={(e) =>
                        setFormData({ ...formData, codigo_interno: e.target.value })
                      }
                      placeholder="Ex: ROL-6205"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="codigo_fabricante">Cód. Fabricante</Label>
                    <Input
                      id="codigo_fabricante"
                      value={formData.codigo_fabricante}
                      onChange={(e) =>
                        setFormData({ ...formData, codigo_fabricante: e.target.value })
                      }
                      placeholder="Ex: SKF-6205-2RS"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData({ ...formData, categoria: e.target.value })
                      }
                      placeholder="Ex: Rolamentos"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fornecedor_padrao">Fornecedor Padrão</Label>
                    <Input
                      id="fornecedor_padrao"
                      value={formData.fornecedor_padrao}
                      onChange={(e) =>
                        setFormData({ ...formData, fornecedor_padrao: e.target.value })
                      }
                      placeholder="Ex: SKF Brasil"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="valor_medio">Valor Médio (R$)</Label>
                    <Input
                      id="valor_medio"
                      type="number"
                      step="0.01"
                      value={formData.valor_medio}
                      onChange={(e) =>
                        setFormData({ ...formData, valor_medio: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prazo_medio_entrega">Prazo (dias)</Label>
                    <Input
                      id="prazo_medio_entrega"
                      type="number"
                      value={formData.prazo_medio_entrega}
                      onChange={(e) =>
                        setFormData({ ...formData, prazo_medio_entrega: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unidade_medida">Unidade</Label>
                    <Input
                      id="unidade_medida"
                      value={formData.unidade_medida}
                      onChange={(e) =>
                        setFormData({ ...formData, unidade_medida: e.target.value })
                      }
                      placeholder="UN"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="estoque_atual">Estoque Atual</Label>
                    <Input
                      id="estoque_atual"
                      type="number"
                      value={formData.estoque_atual}
                      onChange={(e) =>
                        setFormData({ ...formData, estoque_atual: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                    <Input
                      id="estoque_minimo"
                      type="number"
                      value={formData.estoque_minimo}
                      onChange={(e) =>
                        setFormData({ ...formData, estoque_minimo: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData({ ...formData, observacoes: e.target.value })
                    }
                    placeholder="Informações adicionais..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingPart ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alert for low stock */}
        {lowStockParts.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning">
                {lowStockParts.length} peça(s) com estoque baixo
              </p>
              <p className="text-sm text-warning/80">
                {lowStockParts.map((p) => p.nome).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card-elevated overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : filteredParts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peça</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{part.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {part.fornecedor_padrao || 'Sem fornecedor'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm">{part.codigo_interno || '-'}</p>
                    </TableCell>
                    <TableCell>{part.categoria || '-'}</TableCell>
                    <TableCell className="text-right">
                      R$ {part.valor_medio.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          part.estoque_atual <= part.estoque_minimo
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-success/10 text-success'
                        }`}
                      >
                        {part.estoque_atual} {part.unidade_medida}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(part)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletePartId(part.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma peça cadastrada</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                Cadastrar Primeira Peça
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePartId} onOpenChange={() => setDeletePartId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Peça</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default PartsCatalogPage;

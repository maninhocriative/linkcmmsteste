import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Wrench, Edit, Trash2, Search, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { ServiceCatalog, TipoServico, CategoriaServico } from '@/types';

const categoriaLabels: Record<CategoriaServico, string> = {
  ELETRICA: 'Elétrica', MECANICA: 'Mecânica', HIDRAULICA: 'Hidráulica',
  PNEUMATICA: 'Pneumática', AJUSTE: 'Ajuste', LUBRIFICACAO: 'Lubrificação', OUTRO: 'Outro',
};

const tipoLabels: Record<TipoServico, string> = {
  CORRETIVO: 'Corretivo', PREVENTIVO: 'Preventivo',
};

const emptyForm = {
  nome: '', descricao: '', tipo: 'CORRETIVO' as TipoServico,
  categoria: 'OUTRO' as CategoriaServico, tempo_padrao_minutos: 60, valor_servico: 0,
};

const ServicesCatalogPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_catalog')
        .select('*')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data as ServiceCatalog[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const { error } = await supabase.from('services_catalog').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast.success('Serviço cadastrado com sucesso!');
      setIsDialogOpen(false);
      setFormData(emptyForm);
    },
    onError: (e: Error) => toast.error('Erro ao cadastrar: ' + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: typeof emptyForm & { id: string }) => {
      const { error } = await supabase.from('services_catalog').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast.success('Serviço atualizado!');
      setIsDialogOpen(false);
      setEditingService(null);
      setFormData(emptyForm);
    },
    onError: (e: Error) => toast.error('Erro ao atualizar: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services_catalog').update({ status: 'inativo' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      toast.success('Serviço removido!');
      setDeleteServiceId(null);
    },
    onError: (e: Error) => toast.error('Erro ao remover: ' + e.message),
  });

  const handleOpenDialog = (service?: ServiceCatalog) => {
    if (service) {
      setEditingService(service);
      setFormData({
        nome: service.nome, descricao: service.descricao || '',
        tipo: service.tipo, categoria: service.categoria,
        tempo_padrao_minutos: service.tempo_padrao_minutos,
        valor_servico: service.valor_servico,
      });
    } else {
      setEditingService(null);
      setFormData(emptyForm);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatTime = (m: number) => m < 60 ? `${m} min` : `${Math.floor(m/60)}h${m%60>0?` ${m%60}min`:''}`;

  const filtered = services.filter(s =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoriaLabels[s.categoria].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Cadastro de Serviços
            </h1>
            <p className="text-sm text-muted-foreground">Gerencie os serviços de manutenção padronizados</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
                <DialogDescription>Preencha os dados do serviço de manutenção</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input value={formData.nome} onChange={e => setFormData(p => ({...p, nome: e.target.value}))} placeholder="Ex: Troca de Rolamento" />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea value={formData.descricao} onChange={e => setFormData(p => ({...p, descricao: e.target.value}))} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={formData.tipo} onValueChange={v => setFormData(p => ({...p, tipo: v as TipoServico}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CORRETIVO">Corretivo</SelectItem>
                        <SelectItem value="PREVENTIVO">Preventivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select value={formData.categoria} onValueChange={v => setFormData(p => ({...p, categoria: v as CategoriaServico}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoriaLabels).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tempo Padrão (min)</Label>
                    <Input type="number" value={formData.tempo_padrao_minutos} onChange={e => setFormData(p => ({...p, tempo_padrao_minutos: parseInt(e.target.value)||0}))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={formData.valor_servico} onChange={e => setFormData(p => ({...p, valor_servico: parseFloat(e.target.value)||0}))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingService ? 'Salvar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, descrição ou categoria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Tempo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.nome}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{s.descricao || 'Sem descrição'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.tipo === 'PREVENTIVO' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {tipoLabels[s.tipo]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{categoriaLabels[s.categoria]}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatTime(s.tempo_padrao_minutos)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">R$ {s.valor_servico.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(s)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteServiceId(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wrench className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Nenhum serviço cadastrado</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => handleOpenDialog()}>Cadastrar Primeiro Serviço</Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteServiceId} onOpenChange={() => setDeleteServiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteServiceId && deleteMutation.mutate(deleteServiceId)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default ServicesCatalogPage;

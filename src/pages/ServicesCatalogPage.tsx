import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Wrench,
  Edit,
  Trash2,
  Search,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { ServiceCatalog, TipoServico, CategoriaServico } from '@/types';

const categoriaLabels: Record<CategoriaServico, string> = {
  ELETRICA: 'Elétrica',
  MECANICA: 'Mecânica',
  HIDRAULICA: 'Hidráulica',
  PNEUMATICA: 'Pneumática',
  AJUSTE: 'Ajuste',
  LUBRIFICACAO: 'Lubrificação',
  OUTRO: 'Outro',
};

const tipoLabels: Record<TipoServico, string> = {
  CORRETIVO: 'Corretivo',
  PREVENTIVO: 'Preventivo',
};

const ServicesCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalog | null>(null);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'CORRETIVO' as TipoServico,
    categoria: 'OUTRO' as CategoriaServico,
    tempo_padrao_minutos: 60,
    valor_servico: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services_catalog')
      .select('*')
      .eq('status', 'ativo')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar serviços');
      console.error(error);
    } else {
      setParts(data || []);
    }
    setLoading(false);
  };

  const setParts = (data: any[]) => {
    setServices(data);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'CORRETIVO',
      categoria: 'OUTRO',
      tempo_padrao_minutos: 60,
      valor_servico: 0,
    });
    setEditingService(null);
  };

  const handleOpenDialog = (service?: ServiceCatalog) => {
    if (service) {
      setEditingService(service);
      setFormData({
        nome: service.nome,
        descricao: service.descricao || '',
        tipo: service.tipo,
        categoria: service.categoria,
        tempo_padrao_minutos: service.tempo_padrao_minutos,
        valor_servico: service.valor_servico,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return;
    }

    if (editingService) {
      const { error } = await supabase
        .from('services_catalog')
        .update(formData)
        .eq('id', editingService.id);

      if (error) {
        toast.error('Erro ao atualizar serviço');
        console.error(error);
      } else {
        toast.success('Serviço atualizado com sucesso!');
        fetchServices();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('services_catalog')
        .insert([formData]);

      if (error) {
        toast.error('Erro ao cadastrar serviço');
        console.error(error);
      } else {
        toast.success('Serviço cadastrado com sucesso!');
        fetchServices();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteServiceId) return;

    const { error } = await supabase
      .from('services_catalog')
      .update({ status: 'inativo' })
      .eq('id', deleteServiceId);

    if (error) {
      toast.error('Erro ao excluir serviço');
      console.error(error);
    } else {
      toast.success('Serviço removido com sucesso!');
      fetchServices();
    }
    setDeleteServiceId(null);
  };

  const filteredServices = services.filter(
    (service) =>
      service.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoriaLabels[service.categoria].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Cadastro de Serviços
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie os serviços de manutenção padronizados
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do serviço de manutenção
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Serviço *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Troca de Rolamento"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    placeholder="Descrição detalhada do serviço..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: TipoServico) =>
                        setFormData({ ...formData, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CORRETIVO">Corretivo</SelectItem>
                        <SelectItem value="PREVENTIVO">Preventivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value: CategoriaServico) =>
                        setFormData({ ...formData, categoria: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoriaLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tempo_padrao_minutos">Tempo Padrão (min)</Label>
                    <Input
                      id="tempo_padrao_minutos"
                      type="number"
                      value={formData.tempo_padrao_minutos}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tempo_padrao_minutos: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="valor_servico">Valor (R$)</Label>
                    <Input
                      id="valor_servico"
                      type="number"
                      step="0.01"
                      value={formData.valor_servico}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor_servico: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingService ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, descrição ou categoria..."
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
          ) : filteredServices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Tempo Padrão</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{service.nome}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {service.descricao || 'Sem descrição'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          service.tipo === 'PREVENTIVO'
                            ? 'bg-info/10 text-info'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {tipoLabels[service.tipo]}
                      </span>
                    </TableCell>
                    <TableCell>{categoriaLabels[service.categoria]}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{formatTime(service.tempo_padrao_minutos)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {service.valor_servico.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteServiceId(service.id)}
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
              <Wrench className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                Cadastrar Primeiro Serviço
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteServiceId} onOpenChange={() => setDeleteServiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
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
    </div>
  );
};

export default ServicesCatalogPage;

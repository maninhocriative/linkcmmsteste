import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import type { ServiceExecuted, ServiceCatalog, Profile } from '@/types';

interface ServicesExecutedTabProps {
  workOrderId: string;
  isEditable: boolean;
}

export function ServicesExecutedTab({ workOrderId, isEditable }: ServicesExecutedTabProps) {
  const [services, setServices] = useState<ServiceExecuted[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalog[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    service_catalog_id: '',
    nome_servico: '',
    descricao: '',
    tempo_padrao_minutos: 0,
    tempo_real_minutos: 0,
    valor_servico: 0,
    tecnico_id: '',
    tecnico_nome: '',
  });

  useEffect(() => {
    fetchData();
  }, [workOrderId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [servicesRes, catalogRes, techniciansRes] = await Promise.all([
        supabase
          .from('services_executed')
          .select('*')
          .eq('work_order_id', workOrderId)
          .order('created_at', { ascending: false }),
        supabase
          .from('services_catalog')
          .select('*')
          .eq('status', 'ativo')
          .order('nome'),
        supabase
          .from('profiles')
          .select('*')
          .order('nome'),
      ]);

      if (servicesRes.data) setServices(servicesRes.data);
      if (catalogRes.data) setServicesCatalog(catalogRes.data);
      if (techniciansRes.data) setTechnicians(techniciansRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = servicesCatalog.find(s => s.id === serviceId);
    if (service) {
      setFormData({
        ...formData,
        service_catalog_id: serviceId,
        nome_servico: service.nome,
        descricao: service.descricao || '',
        tempo_padrao_minutos: service.tempo_padrao_minutos || 0,
        valor_servico: service.valor_servico || 0,
      });
    }
  };

  const handleTechnicianSelect = (techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    if (tech) {
      setFormData({
        ...formData,
        tecnico_id: tech.user_id,
        tecnico_nome: tech.nome,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('services_executed')
        .insert({
          work_order_id: workOrderId,
          service_catalog_id: formData.service_catalog_id || null,
          nome_servico: formData.nome_servico,
          descricao: formData.descricao,
          tempo_padrao_minutos: formData.tempo_padrao_minutos,
          tempo_real_minutos: formData.tempo_real_minutos,
          valor_servico: formData.valor_servico,
          tecnico_id: formData.tecnico_id || null,
          tecnico_nome: formData.tecnico_nome,
        });

      if (error) throw error;

      toast.success('Serviço registrado');
      setShowForm(false);
      setFormData({
        service_catalog_id: '',
        nome_servico: '',
        descricao: '',
        tempo_padrao_minutos: 0,
        tempo_real_minutos: 0,
        valor_servico: 0,
        tecnico_id: '',
        tecnico_nome: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Erro ao registrar serviço');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services_executed')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Serviço removido');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao remover serviço');
    }
  };

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const totalValue = services.reduce((sum, item) => sum + (item.valor_servico || 0), 0);
  const totalTime = services.reduce((sum, item) => sum + (item.tempo_real_minutos || 0), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Serviços Executados</h3>
        </div>
        {isEditable && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Serviço
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Novo Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Serviço do Catálogo</Label>
                <Select onValueChange={handleServiceSelect} value={formData.service_catalog_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar serviço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {servicesCatalog.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome do Serviço *</Label>
                <Input
                  value={formData.nome_servico}
                  onChange={(e) => setFormData({ ...formData, nome_servico: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Técnico Responsável</Label>
                <Select onValueChange={handleTechnicianSelect} value={formData.tecnico_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar técnico..." />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo Padrão (min)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.tempo_padrao_minutos}
                  onChange={(e) => setFormData({ ...formData, tempo_padrao_minutos: parseInt(e.target.value) || 0 })}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo Real (min) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.tempo_real_minutos}
                  onChange={(e) => setFormData({ ...formData, tempo_real_minutos: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Valor do Serviço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_servico}
                  onChange={(e) => setFormData({ ...formData, valor_servico: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="flex gap-2 md:col-span-3">
                <Button type="submit">Adicionar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {services.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead className="text-center">Tempo Padrão</TableHead>
                  <TableHead className="text-center">Tempo Real</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {isEditable && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome_servico}</TableCell>
                    <TableCell>{item.descricao || '-'}</TableCell>
                    <TableCell>{item.tecnico_nome || '-'}</TableCell>
                    <TableCell className="text-center">{formatMinutes(item.tempo_padrao_minutos)}</TableCell>
                    <TableCell className="text-center font-medium">{formatMinutes(item.tempo_real_minutos)}</TableCell>
                    <TableCell className="text-right">
                      {item.valor_servico?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    {isEditable && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-4">
            <Card className="w-fit">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Tempo Total:</span>
                  <span className="text-xl font-bold">{formatMinutes(totalTime)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="w-fit">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="text-xl font-bold text-primary">
                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum serviço executado registrado
          </CardContent>
        </Card>
      )}
    </div>
  );
}

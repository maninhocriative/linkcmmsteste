import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import type { PartAcquisition, PartCatalog, StatusCompra } from '@/types';

interface PartsAcquisitionTabProps {
  workOrderId: string;
  isEditable: boolean;
}

const statusColors: Record<StatusCompra, string> = {
  PLANEJADO: 'bg-gray-500',
  ORCADO: 'bg-blue-500',
  COMPRADO: 'bg-yellow-500',
  RECEBIDO: 'bg-green-500',
};

const statusLabels: Record<StatusCompra, string> = {
  PLANEJADO: 'Planejado',
  ORCADO: 'Orçado',
  COMPRADO: 'Comprado',
  RECEBIDO: 'Recebido',
};

export function PartsAcquisitionTab({ workOrderId, isEditable }: PartsAcquisitionTabProps) {
  const [acquisitions, setAcquisitions] = useState<PartAcquisition[]>([]);
  const [partsCatalog, setPartsCatalog] = useState<PartCatalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    part_catalog_id: '',
    nome_peca: '',
    codigo: '',
    quantidade: 1,
    valor_unitario: 0,
    fornecedor: '',
    prazo_entrega_dias: 0,
    data_prevista_chegada: '',
    status: 'PLANEJADO' as StatusCompra,
    observacoes: '',
  });

  useEffect(() => {
    fetchData();
  }, [workOrderId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [acquisitionsRes, catalogRes] = await Promise.all([
        supabase
          .from('parts_acquisition')
          .select('*')
          .eq('work_order_id', workOrderId)
          .order('created_at', { ascending: false }),
        supabase
          .from('parts_catalog')
          .select('*')
          .eq('status', 'ativo')
          .order('nome'),
      ]);

      if (acquisitionsRes.data) setAcquisitions(acquisitionsRes.data);
      if (catalogRes.data) setPartsCatalog(catalogRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartSelect = (partId: string) => {
    const part = partsCatalog.find(p => p.id === partId);
    if (part) {
      setFormData({
        ...formData,
        part_catalog_id: partId,
        nome_peca: part.nome,
        codigo: part.codigo_interno || part.codigo_fabricante || '',
        valor_unitario: part.valor_medio || 0,
        fornecedor: part.fornecedor_padrao || '',
        prazo_entrega_dias: part.prazo_medio_entrega || 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const valorTotal = formData.quantidade * formData.valor_unitario;
      
      const { error } = await supabase
        .from('parts_acquisition')
        .insert({
          work_order_id: workOrderId,
          part_catalog_id: formData.part_catalog_id || null,
          nome_peca: formData.nome_peca,
          codigo: formData.codigo,
          quantidade: formData.quantidade,
          valor_unitario: formData.valor_unitario,
          valor_total: valorTotal,
          fornecedor: formData.fornecedor,
          prazo_entrega_dias: formData.prazo_entrega_dias,
          data_prevista_chegada: formData.data_prevista_chegada || null,
          status: formData.status,
          observacoes: formData.observacoes,
        });

      if (error) throw error;

      toast.success('Peça adicionada ao plano de aquisição');
      setShowForm(false);
      setFormData({
        part_catalog_id: '',
        nome_peca: '',
        codigo: '',
        quantidade: 1,
        valor_unitario: 0,
        fornecedor: '',
        prazo_entrega_dias: 0,
        data_prevista_chegada: '',
        status: 'PLANEJADO',
        observacoes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error adding acquisition:', error);
      toast.error('Erro ao adicionar peça');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('parts_acquisition')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Item removido');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao remover item');
    }
  };

  const handleStatusChange = async (id: string, newStatus: StatusCompra) => {
    try {
      const { error } = await supabase
        .from('parts_acquisition')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success('Status atualizado');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const totalValue = acquisitions.reduce((sum, item) => sum + (item.valor_total || 0), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Plano de Aquisição de Peças</h3>
        </div>
        {isEditable && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Peça
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova Aquisição</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Peça do Catálogo</Label>
                <Select onValueChange={handlePartSelect} value={formData.part_catalog_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar peça..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partsCatalog.map(part => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.nome} {part.codigo_interno && `(${part.codigo_interno})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome da Peça *</Label>
                <Input
                  value={formData.nome_peca}
                  onChange={(e) => setFormData({ ...formData, nome_peca: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Unitário (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_unitario}
                  onChange={(e) => setFormData({ ...formData, valor_unitario: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input
                  type="number"
                  value={(formData.quantidade * formData.valor_unitario).toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Input
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo de Entrega (dias)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.prazo_entrega_dias}
                  onChange={(e) => setFormData({ ...formData, prazo_entrega_dias: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Prevista Chegada</Label>
                <Input
                  type="date"
                  value={formData.data_prevista_chegada}
                  onChange={(e) => setFormData({ ...formData, data_prevista_chegada: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: StatusCompra) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANEJADO">Planejado</SelectItem>
                    <SelectItem value="ORCADO">Orçado</SelectItem>
                    <SelectItem value="COMPRADO">Comprado</SelectItem>
                    <SelectItem value="RECEBIDO">Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Input
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
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

      {acquisitions.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peça</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  {isEditable && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {acquisitions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome_peca}</TableCell>
                    <TableCell>{item.codigo || '-'}</TableCell>
                    <TableCell className="text-center">{item.quantidade}</TableCell>
                    <TableCell className="text-right">
                      {item.valor_unitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell>{item.fornecedor || '-'}</TableCell>
                    <TableCell>
                      {item.prazo_entrega_dias ? `${item.prazo_entrega_dias} dias` : '-'}
                    </TableCell>
                    <TableCell>
                      {isEditable ? (
                        <Select
                          value={item.status || 'PLANEJADO'}
                          onValueChange={(value: StatusCompra) => handleStatusChange(item.id, value)}
                        >
                          <SelectTrigger className="h-7 w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLANEJADO">Planejado</SelectItem>
                            <SelectItem value="ORCADO">Orçado</SelectItem>
                            <SelectItem value="COMPRADO">Comprado</SelectItem>
                            <SelectItem value="RECEBIDO">Recebido</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={statusColors[item.status || 'PLANEJADO']}>
                          {statusLabels[item.status || 'PLANEJADO']}
                        </Badge>
                      )}
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

          <div className="flex justify-end">
            <Card className="w-fit">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Total Estimado:</span>
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
            Nenhuma peça no plano de aquisição
          </CardContent>
        </Card>
      )}
    </div>
  );
}

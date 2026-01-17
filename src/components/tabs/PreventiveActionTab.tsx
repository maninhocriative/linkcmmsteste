import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Shield, ChevronDown, ChevronUp, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PreventiveAction, Periodicidade, Profile } from '@/types';

interface PreventiveActionTabProps {
  workOrderId: string;
  isEditable: boolean;
}

const periodicidadeLabels: Record<Periodicidade, string> = {
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export function PreventiveActionTab({ workOrderId, isEditable }: PreventiveActionTabProps) {
  const [actions, setActions] = useState<PreventiveAction[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    descricao: '',
    pecas_recomendadas: '',
    custo_estimado: 0,
    periodicidade: '' as Periodicidade | '',
    responsavel_id: '',
    responsavel_nome: '',
    observacoes: '',
  });

  useEffect(() => {
    fetchData();
  }, [workOrderId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [actionsRes, techniciansRes] = await Promise.all([
        supabase
          .from('preventive_actions')
          .select('*')
          .eq('work_order_id', workOrderId)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .order('nome'),
      ]);

      if (actionsRes.data) {
        setActions(actionsRes.data);
        // Expand all by default
        setExpandedItems(new Set(actionsRes.data.map(a => a.id)));
      }
      if (techniciansRes.data) setTechnicians(techniciansRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponsibleSelect = (techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    if (tech) {
      setFormData({
        ...formData,
        responsavel_id: tech.user_id,
        responsavel_nome: tech.nome,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('preventive_actions')
        .insert({
          work_order_id: workOrderId,
          descricao: formData.descricao,
          pecas_recomendadas: formData.pecas_recomendadas || null,
          custo_estimado: formData.custo_estimado,
          periodicidade: formData.periodicidade || null,
          responsavel_id: formData.responsavel_id || null,
          responsavel_nome: formData.responsavel_nome || null,
          observacoes: formData.observacoes || null,
        });

      if (error) throw error;

      toast.success('Ação preventiva adicionada');
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error adding action:', error);
      toast.error('Erro ao adicionar ação preventiva');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('preventive_actions')
        .update({
          descricao: formData.descricao,
          pecas_recomendadas: formData.pecas_recomendadas || null,
          custo_estimado: formData.custo_estimado,
          periodicidade: formData.periodicidade || null,
          responsavel_id: formData.responsavel_id || null,
          responsavel_nome: formData.responsavel_nome || null,
          observacoes: formData.observacoes || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Ação preventiva atualizada');
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating action:', error);
      toast.error('Erro ao atualizar ação preventiva');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('preventive_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Ação preventiva removida');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao remover ação preventiva');
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      pecas_recomendadas: '',
      custo_estimado: 0,
      periodicidade: '',
      responsavel_id: '',
      responsavel_nome: '',
      observacoes: '',
    });
  };

  const startEditing = (action: PreventiveAction) => {
    setEditingId(action.id);
    setFormData({
      descricao: action.descricao,
      pecas_recomendadas: action.pecas_recomendadas || '',
      custo_estimado: action.custo_estimado || 0,
      periodicidade: action.periodicidade || '',
      responsavel_id: action.responsavel_id || '',
      responsavel_nome: action.responsavel_nome || '',
      observacoes: action.observacoes || '',
    });
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const totalCost = actions.reduce((sum, item) => sum + (item.custo_estimado || 0), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Ações Preventivas</h3>
        </div>
        {isEditable && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Ação
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova Ação Preventiva</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição da Ação *</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva a ação preventiva recomendada..."
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Peças Recomendadas</Label>
                  <Input
                    value={formData.pecas_recomendadas}
                    onChange={(e) => setFormData({ ...formData, pecas_recomendadas: e.target.value })}
                    placeholder="Ex: Rolamento 6205, Correia dentada..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custo Estimado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custo_estimado}
                    onChange={(e) => setFormData({ ...formData, custo_estimado: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Periodicidade Sugerida</Label>
                  <Select
                    value={formData.periodicidade}
                    onValueChange={(value: Periodicidade) => setFormData({ ...formData, periodicidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIARIA">Diária</SelectItem>
                      <SelectItem value="SEMANAL">Semanal</SelectItem>
                      <SelectItem value="MENSAL">Mensal</SelectItem>
                      <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                      <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                      <SelectItem value="ANUAL">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Responsável pela Execução</Label>
                  <Select onValueChange={handleResponsibleSelect} value={formData.responsavel_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
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

                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Input
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Adicionar</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map((action) => (
            <Collapsible
              key={action.id}
              open={expandedItems.has(action.id)}
              onOpenChange={() => toggleExpand(action.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-green-600" />
                        <CardTitle className="text-base font-medium">
                          {action.descricao.length > 80
                            ? `${action.descricao.substring(0, 80)}...`
                            : action.descricao}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.periodicidade && (
                          <Badge variant="outline">
                            {periodicidadeLabels[action.periodicidade]}
                          </Badge>
                        )}
                        {action.custo_estimado ? (
                          <Badge variant="secondary">
                            {action.custo_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </Badge>
                        ) : null}
                        {expandedItems.has(action.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {editingId === action.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleUpdate(action.id); }} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Descrição da Ação *</Label>
                          <Textarea
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            required
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Peças Recomendadas</Label>
                            <Input
                              value={formData.pecas_recomendadas}
                              onChange={(e) => setFormData({ ...formData, pecas_recomendadas: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Custo Estimado (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.custo_estimado}
                              onChange={(e) => setFormData({ ...formData, custo_estimado: parseFloat(e.target.value) || 0 })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Periodicidade</Label>
                            <Select
                              value={formData.periodicidade}
                              onValueChange={(value: Periodicidade) => setFormData({ ...formData, periodicidade: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DIARIA">Diária</SelectItem>
                                <SelectItem value="SEMANAL">Semanal</SelectItem>
                                <SelectItem value="MENSAL">Mensal</SelectItem>
                                <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                                <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                                <SelectItem value="ANUAL">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Responsável</Label>
                            <Select onValueChange={handleResponsibleSelect} value={formData.responsavel_id}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
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

                          <div className="space-y-2 md:col-span-2">
                            <Label>Observações</Label>
                            <Input
                              value={formData.observacoes}
                              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button type="submit" size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditingId(null); resetForm(); }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                          <p>{action.descricao}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {action.pecas_recomendadas && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Peças Recomendadas</p>
                              <p>{action.pecas_recomendadas}</p>
                            </div>
                          )}
                          {action.custo_estimado ? (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Custo Estimado</p>
                              <p className="font-medium">
                                {action.custo_estimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </p>
                            </div>
                          ) : null}
                          {action.periodicidade && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Periodicidade</p>
                              <p>{periodicidadeLabels[action.periodicidade]}</p>
                            </div>
                          )}
                          {action.responsavel_nome && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Responsável</p>
                              <p>{action.responsavel_nome}</p>
                            </div>
                          )}
                        </div>

                        {action.observacoes && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Observações</p>
                            <p>{action.observacoes}</p>
                          </div>
                        )}

                        {isEditable && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(action)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(action.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}

          <div className="flex justify-end">
            <Card className="w-fit">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Custo Total Estimado:</span>
                  <span className="text-xl font-bold text-primary">
                    {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma ação preventiva registrada
          </CardContent>
        </Card>
      )}
    </div>
  );
}

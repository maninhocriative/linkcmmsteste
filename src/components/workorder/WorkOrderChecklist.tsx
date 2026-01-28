import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ClipboardList, Plus, Check, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ChecklistItem {
  id: string;
  work_order_id: string;
  item_id?: string;
  item_number?: string;
  componente: string;
  ponto_verificacao: string;
  tipo_procedimento: string;
  concluido: boolean;
  observacao?: string;
  tecnico_nome?: string;
  data_execucao?: string;
}

interface Template {
  id: string;
  nome: string;
  modelo_equipamento?: string;
}

interface TemplateItem {
  id: string;
  item_number: string;
  componente: string;
  ponto_verificacao: string;
  tipo_procedimento: string;
  instrucoes?: string;
}

interface WorkOrderChecklistProps {
  workOrderId: string;
  assetId?: string;
  readOnly?: boolean;
  tecnicoNome?: string;
}

const TIPO_PROCEDIMENTO_LABELS: Record<string, string> = {
  VISUAL: 'Visual',
  LIMPEZA: 'Limpeza',
  TROCA: 'Troca',
  LUBRIFICACAO: 'Lubrificação',
  AJUSTE: 'Ajuste',
  TESTE: 'Teste',
  MEDICAO: 'Medição',
};

const WorkOrderChecklist: React.FC<WorkOrderChecklistProps> = ({
  workOrderId,
  assetId,
  readOnly = false,
  tecnicoNome,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch existing checklist items
  useEffect(() => {
    const fetchChecklist = async () => {
      const { data, error } = await supabase
        .from('work_order_checklist')
        .select('*')
        .eq('work_order_id', workOrderId)
        .order('item_number');

      if (!error && data) {
        setItems(data as ChecklistItem[]);
      }
      setLoading(false);
    };

    fetchChecklist();
  }, [workOrderId]);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from('maintenance_plan_templates')
        .select('*')
        .eq('status', 'ativo')
        .order('nome');

      if (!error && data) {
        setTemplates(data);
      }
    };

    fetchTemplates();
  }, []);

  // Fetch template items when template selected
  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateItems([]);
      return;
    }

    const fetchTemplateItems = async () => {
      const { data, error } = await supabase
        .from('maintenance_plan_items')
        .select('*')
        .eq('template_id', selectedTemplate)
        .order('ordem');

      if (!error && data) {
        setTemplateItems(data as TemplateItem[]);
      }
    };

    fetchTemplateItems();
  }, [selectedTemplate]);

  const handleToggleItem = async (itemId: string, concluido: boolean) => {
    if (readOnly) return;

    setSaving(true);
    const updateData: any = {
      concluido,
      data_execucao: concluido ? new Date().toISOString() : null,
      tecnico_nome: concluido ? tecnicoNome : null,
    };

    const { error } = await supabase
      .from('work_order_checklist')
      .update(updateData)
      .eq('id', itemId);

    if (error) {
      toast.error('Erro ao atualizar item');
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, ...updateData }
            : item
        )
      );
    }
    setSaving(false);
  };

  const handleAddObservacao = async (itemId: string, observacao: string) => {
    if (readOnly) return;

    const { error } = await supabase
      .from('work_order_checklist')
      .update({ observacao })
      .eq('id', itemId);

    if (error) {
      toast.error('Erro ao salvar observação');
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, observacao } : item
        )
      );
    }
  };

  const handleImportTemplate = async () => {
    if (!selectedTemplate || templateItems.length === 0) return;

    setSaving(true);
    const newItems = templateItems.map((ti) => ({
      work_order_id: workOrderId,
      item_id: ti.id,
      item_number: ti.item_number,
      componente: ti.componente,
      ponto_verificacao: ti.ponto_verificacao,
      tipo_procedimento: ti.tipo_procedimento as 'VISUAL' | 'LIMPEZA' | 'TROCA' | 'LUBRIFICACAO' | 'AJUSTE' | 'TESTE' | 'MEDICAO',
      concluido: false,
    }));

    const { data, error } = await supabase
      .from('work_order_checklist')
      .insert(newItems)
      .select();

    if (error) {
      toast.error('Erro ao importar checklist');
    } else if (data) {
      setItems((prev) => [...prev, ...(data as ChecklistItem[])]);
      toast.success(`${data.length} itens importados do template`);
      setSelectedTemplate('');
    }
    setSaving(false);
  };

  const completedCount = items.filter((i) => i.concluido).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group items by componente
  const groupedItems = items.reduce((acc, item) => {
    const key = item.componente;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Checklist de Manutenção</h3>
        </div>
        {totalCount > 0 && (
          <Badge variant={progressPercent === 100 ? 'default' : 'secondary'}>
            {completedCount}/{totalCount} ({progressPercent}%)
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Import template section */}
      {!readOnly && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-4">
          <Label className="mb-2 block text-sm font-medium">
            Importar checklist de um template
          </Label>
          <div className="flex gap-2">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleImportTemplate}
              disabled={!selectedTemplate || saving}
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" />
              Importar
            </Button>
          </div>
          {templateItems.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {templateItems.length} itens serão importados
            </p>
          )}
        </div>
      )}

      {/* Checklist items grouped by component */}
      {Object.keys(groupedItems).length > 0 ? (
        <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedItems)}>
          {Object.entries(groupedItems).map(([componente, componentItems]) => {
            const componentCompleted = componentItems.filter((i) => i.concluido).length;
            const componentTotal = componentItems.length;

            return (
              <AccordionItem key={componente} value={componente}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{componente}</span>
                    <Badge
                      variant={componentCompleted === componentTotal ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {componentCompleted}/{componentTotal}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pl-2">
                    {componentItems.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-3 transition-colors ${
                          item.concluido
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border bg-background'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={item.concluido}
                            onCheckedChange={(checked) =>
                              handleToggleItem(item.id, checked as boolean)
                            }
                            disabled={readOnly || saving}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {item.item_number && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  {item.item_number}
                                </span>
                              )}
                              <span
                                className={`text-sm ${
                                  item.concluido ? 'text-muted-foreground line-through' : 'text-foreground'
                                }`}
                              >
                                {item.ponto_verificacao}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {TIPO_PROCEDIMENTO_LABELS[item.tipo_procedimento] || item.tipo_procedimento}
                              </Badge>
                              {item.concluido && item.tecnico_nome && (
                                <span className="text-xs text-muted-foreground">
                                  <Check className="mr-1 inline h-3 w-3 text-success" />
                                  {item.tecnico_nome}
                                </span>
                              )}
                            </div>
                            {/* Observation field */}
                            {!readOnly && (
                              <Input
                                placeholder="Observação (opcional)"
                                value={item.observacao || ''}
                                onChange={(e) => handleAddObservacao(item.id, e.target.value)}
                                className="mt-2 h-8 text-xs"
                              />
                            )}
                            {readOnly && item.observacao && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Obs: {item.observacao}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum item no checklist.{' '}
            {!readOnly && 'Importe um template acima para começar.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkOrderChecklist;

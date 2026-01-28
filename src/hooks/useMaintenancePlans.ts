import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaintenancePlanTemplate, MaintenancePlanItem, AssetExtended, FrequenciaManutencao, TipoProcedimento } from '@/types/maintenance';
import { toast } from 'sonner';

// Fetch all templates
export function useMaintenanceTemplates() {
  return useQuery({
    queryKey: ['maintenance-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_plan_templates')
        .select('*')
        .eq('status', 'ativo')
        .order('nome');
      
      if (error) throw error;
      return data as MaintenancePlanTemplate[];
    },
  });
}

// Fetch template items
export function useTemplateItems(templateId: string | null) {
  return useQuery({
    queryKey: ['template-items', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('maintenance_plan_items')
        .select('*')
        .eq('template_id', templateId)
        .order('ordem');
      
      if (error) throw error;
      return data as MaintenancePlanItem[];
    },
    enabled: !!templateId,
  });
}

// Fetch assets with template info
export function useAssetsWithTemplates() {
  return useQuery({
    queryKey: ['assets-with-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'ativo')
        .order('nome');
      
      if (error) throw error;
      return data as AssetExtended[];
    },
  });
}

// Fetch verification points catalog
export function useVerificationPoints() {
  return useQuery({
    queryKey: ['verification-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_points_catalog')
        .select('*')
        .eq('status', 'ativo')
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as { id: string; nome: string; descricao: string | null; categoria: string | null; status: string | null }[];
    },
  });
}

// Create template mutation
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<MaintenancePlanTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('maintenance_plan_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-templates'] });
      toast.success('Template criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar template: ' + error.message);
    },
  });
}

// Create item mutation
export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: {
      template_id: string;
      item_number: string;
      componente: string;
      ponto_verificacao: string;
      frequencia: FrequenciaManutencao;
      tipo_procedimento: TipoProcedimento;
      instrucoes?: string;
      ordem: number;
    }) => {
      const { data, error } = await supabase
        .from('maintenance_plan_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-items', variables.template_id] });
      toast.success('Item adicionado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar item: ' + error.message);
    },
  });
}

// Update item mutation
export function useUpdateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, templateId, ...updates }: Partial<MaintenancePlanItem> & { id: string; templateId: string }) => {
      const { data, error } = await supabase
        .from('maintenance_plan_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-items', variables.templateId] });
      toast.success('Item atualizado');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar item: ' + error.message);
    },
  });
}

// Delete item mutation
export function useDeleteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, templateId }: { id: string; templateId: string }) => {
      const { error } = await supabase
        .from('maintenance_plan_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-items', variables.templateId] });
      toast.success('Item removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover item: ' + error.message);
    },
  });
}

// Assign template to asset
export function useAssignTemplateToAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assetId, templateId }: { assetId: string; templateId: string | null }) => {
      const { data, error } = await supabase
        .from('assets')
        .update({ maintenance_template_id: templateId })
        .eq('id', assetId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets-with-templates'] });
      toast.success('Template vinculado ao ativo');
    },
    onError: (error) => {
      toast.error('Erro ao vincular template: ' + error.message);
    },
  });
}

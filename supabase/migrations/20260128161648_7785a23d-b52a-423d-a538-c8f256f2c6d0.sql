-- 1. Adicionar novos campos à tabela assets existente
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS tag text UNIQUE,
ADD COLUMN IF NOT EXISTS modelo text,
ADD COLUMN IF NOT EXISTS numero_serie text,
ADD COLUMN IF NOT EXISTS fabricante text;

-- 2. Criar enum para frequência de manutenção
CREATE TYPE public.frequencia_manutencao AS ENUM ('DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- 3. Criar enum para tipo de procedimento
CREATE TYPE public.tipo_procedimento AS ENUM ('VISUAL', 'LIMPEZA', 'TROCA', 'LUBRIFICACAO', 'AJUSTE', 'TESTE', 'MEDICAO');

-- 4. Criar tabela de templates de checklist (base por modelo)
CREATE TABLE public.maintenance_plan_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    modelo_equipamento text,
    descricao text,
    status text DEFAULT 'ativo',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. Criar tabela de itens do checklist template
CREATE TABLE public.maintenance_plan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid REFERENCES public.maintenance_plan_templates(id) ON DELETE CASCADE NOT NULL,
    item_number text NOT NULL,
    componente text NOT NULL,
    ponto_verificacao text NOT NULL,
    frequencia public.frequencia_manutencao NOT NULL DEFAULT 'MENSAL',
    tipo_procedimento public.tipo_procedimento NOT NULL DEFAULT 'VISUAL',
    instrucoes text,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. Criar tabela de customizações por ativo específico
CREATE TABLE public.asset_maintenance_overrides (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
    template_id uuid REFERENCES public.maintenance_plan_templates(id) ON DELETE SET NULL,
    item_id uuid REFERENCES public.maintenance_plan_items(id) ON DELETE CASCADE,
    frequencia_customizada public.frequencia_manutencao,
    observacoes text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(asset_id, item_id)
);

-- 7. Vincular assets a templates
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS maintenance_template_id uuid REFERENCES public.maintenance_plan_templates(id);

-- 8. Habilitar RLS
ALTER TABLE public.maintenance_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance_overrides ENABLE ROW LEVEL SECURITY;

-- 9. Políticas para maintenance_plan_templates
CREATE POLICY "Anyone authenticated can view templates"
ON public.maintenance_plan_templates FOR SELECT
USING (true);

CREATE POLICY "Admins and technicians can manage templates"
ON public.maintenance_plan_templates FOR ALL
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 10. Políticas para maintenance_plan_items
CREATE POLICY "Anyone authenticated can view plan items"
ON public.maintenance_plan_items FOR SELECT
USING (true);

CREATE POLICY "Admins and technicians can manage plan items"
ON public.maintenance_plan_items FOR ALL
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 11. Políticas para asset_maintenance_overrides
CREATE POLICY "Anyone authenticated can view overrides"
ON public.asset_maintenance_overrides FOR SELECT
USING (true);

CREATE POLICY "Admins and technicians can manage overrides"
ON public.asset_maintenance_overrides FOR ALL
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 12. Triggers para updated_at
CREATE TRIGGER update_maintenance_plan_templates_updated_at
BEFORE UPDATE ON public.maintenance_plan_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_plan_items_updated_at
BEFORE UPDATE ON public.maintenance_plan_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asset_maintenance_overrides_updated_at
BEFORE UPDATE ON public.asset_maintenance_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
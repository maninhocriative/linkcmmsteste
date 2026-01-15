-- 1. Add automatic time control fields to work_orders
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS data_hora_inicio timestamp with time zone,
ADD COLUMN IF NOT EXISTS data_hora_fim timestamp with time zone,
ADD COLUMN IF NOT EXISTS tempo_total_minutos integer,
ADD COLUMN IF NOT EXISTS tempo_total_horas decimal(10,2);

-- 2. Create periodicidade enum for preventive actions
DO $$ BEGIN
    CREATE TYPE public.periodicidade AS ENUM ('DIARIA', 'SEMANAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create status_compra enum for parts acquisition
DO $$ BEGIN
    CREATE TYPE public.status_compra AS ENUM ('PLANEJADO', 'ORCADO', 'COMPRADO', 'RECEBIDO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create tipo_servico enum
DO $$ BEGIN
    CREATE TYPE public.tipo_servico AS ENUM ('CORRETIVO', 'PREVENTIVO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Create categoria_servico enum
DO $$ BEGIN
    CREATE TYPE public.categoria_servico AS ENUM ('ELETRICA', 'MECANICA', 'HIDRAULICA', 'PNEUMATICA', 'AJUSTE', 'LUBRIFICACAO', 'OUTRO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. Create parts catalog table (cadastro de peças)
CREATE TABLE IF NOT EXISTS public.parts_catalog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    codigo_interno text UNIQUE,
    codigo_fabricante text,
    categoria text,
    fornecedor_padrao text,
    valor_medio decimal(10,2) DEFAULT 0,
    prazo_medio_entrega integer DEFAULT 0,
    estoque_atual integer DEFAULT 0,
    estoque_minimo integer DEFAULT 0,
    unidade_medida text DEFAULT 'UN',
    observacoes text,
    status text DEFAULT 'ativo',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view parts catalog"
ON public.parts_catalog FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and technicians can manage parts catalog"
ON public.parts_catalog FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 7. Create services catalog table (cadastro de serviços)
CREATE TABLE IF NOT EXISTS public.services_catalog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    tipo tipo_servico NOT NULL DEFAULT 'CORRETIVO',
    categoria categoria_servico NOT NULL DEFAULT 'OUTRO',
    tempo_padrao_minutos integer DEFAULT 60,
    valor_servico decimal(10,2) DEFAULT 0,
    status text DEFAULT 'ativo',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view services catalog"
ON public.services_catalog FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and technicians can manage services catalog"
ON public.services_catalog FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 8. Create parts acquisition plan table (plano de aquisição)
CREATE TABLE IF NOT EXISTS public.parts_acquisition (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id uuid REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
    part_catalog_id uuid REFERENCES public.parts_catalog(id),
    nome_peca text NOT NULL,
    codigo text,
    quantidade integer NOT NULL DEFAULT 1,
    valor_unitario decimal(10,2) DEFAULT 0,
    valor_total decimal(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    fornecedor text,
    prazo_entrega_dias integer,
    data_prevista_chegada date,
    status status_compra DEFAULT 'PLANEJADO',
    observacoes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_acquisition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view parts acquisition"
ON public.parts_acquisition FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and technicians can manage parts acquisition"
ON public.parts_acquisition FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 9. Create preventive actions table (ações preventivas estruturadas)
CREATE TABLE IF NOT EXISTS public.preventive_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id uuid REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
    descricao text NOT NULL,
    pecas_recomendadas text,
    custo_estimado decimal(10,2) DEFAULT 0,
    periodicidade periodicidade,
    responsavel_id uuid,
    responsavel_nome text,
    observacoes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.preventive_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view preventive actions"
ON public.preventive_actions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and technicians can manage preventive actions"
ON public.preventive_actions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 10. Create services executed table (serviços executados)
CREATE TABLE IF NOT EXISTS public.services_executed (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id uuid REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
    service_catalog_id uuid REFERENCES public.services_catalog(id),
    nome_servico text NOT NULL,
    descricao text,
    tempo_padrao_minutos integer DEFAULT 0,
    tempo_real_minutos integer DEFAULT 0,
    valor_servico decimal(10,2) DEFAULT 0,
    tecnico_id uuid,
    tecnico_nome text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.services_executed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view services executed"
ON public.services_executed FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and technicians can manage services executed"
ON public.services_executed FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 11. Create stock movements table (movimentação de estoque)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    part_catalog_id uuid REFERENCES public.parts_catalog(id) ON DELETE CASCADE NOT NULL,
    work_order_id uuid REFERENCES public.work_orders(id),
    tipo text NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
    quantidade integer NOT NULL,
    quantidade_anterior integer,
    quantidade_posterior integer,
    motivo text,
    usuario_id uuid,
    usuario_nome text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view stock movements"
ON public.stock_movements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and technicians can manage stock movements"
ON public.stock_movements FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'MANUTENCAO'));

-- 12. Update parts_used to reference catalog
ALTER TABLE public.parts_used 
ADD COLUMN IF NOT EXISTS part_catalog_id uuid REFERENCES public.parts_catalog(id),
ADD COLUMN IF NOT EXISTS valor_unitario decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_total decimal(10,2) DEFAULT 0;

-- 13. Create triggers for updated_at
CREATE TRIGGER update_parts_catalog_updated_at
    BEFORE UPDATE ON public.parts_catalog
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_catalog_updated_at
    BEFORE UPDATE ON public.services_catalog
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parts_acquisition_updated_at
    BEFORE UPDATE ON public.parts_acquisition
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preventive_actions_updated_at
    BEFORE UPDATE ON public.preventive_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_executed_updated_at
    BEFORE UPDATE ON public.services_executed
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Function to update stock when part is used
CREATE OR REPLACE FUNCTION public.update_stock_on_part_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_stock integer;
BEGIN
    IF NEW.part_catalog_id IS NOT NULL THEN
        -- Get current stock
        SELECT estoque_atual INTO current_stock
        FROM public.parts_catalog
        WHERE id = NEW.part_catalog_id;
        
        -- Update stock
        UPDATE public.parts_catalog
        SET estoque_atual = estoque_atual - NEW.quantidade
        WHERE id = NEW.part_catalog_id;
        
        -- Record movement
        INSERT INTO public.stock_movements (
            part_catalog_id,
            work_order_id,
            tipo,
            quantidade,
            quantidade_anterior,
            quantidade_posterior,
            motivo
        ) VALUES (
            NEW.part_catalog_id,
            NEW.work_order_id,
            'SAIDA',
            NEW.quantidade,
            current_stock,
            current_stock - NEW.quantidade,
            'Uso em OS'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_stock_on_part_used
    AFTER INSERT ON public.parts_used
    FOR EACH ROW
    EXECUTE FUNCTION public.update_stock_on_part_used();

-- 15. Function to calculate work order time
CREATE OR REPLACE FUNCTION public.calculate_work_order_time()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.data_hora_fim IS NOT NULL AND NEW.data_hora_inicio IS NOT NULL THEN
        NEW.tempo_total_minutos := EXTRACT(EPOCH FROM (NEW.data_hora_fim - NEW.data_hora_inicio)) / 60;
        NEW.tempo_total_horas := ROUND(NEW.tempo_total_minutos::decimal / 60, 2);
        NEW.tempo_gasto := NEW.tempo_total_minutos || ' min';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_work_order_time
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_work_order_time();

-- 16. Insert sample data for parts catalog
INSERT INTO public.parts_catalog (nome, codigo_interno, codigo_fabricante, categoria, fornecedor_padrao, valor_medio, estoque_atual, estoque_minimo) VALUES
('Rolamento 6205', 'ROL-6205', 'SKF-6205-2RS', 'Rolamentos', 'SKF Brasil', 45.00, 10, 3),
('Correia V A-68', 'COR-A68', 'GATES-A68', 'Correias', 'Gates', 32.50, 5, 2),
('Fusível 10A', 'FUS-10A', 'BUSSMANN-10A', 'Elétrica', 'Bussmann', 3.50, 50, 20),
('Óleo Lubrificante 10W40', 'OLE-10W40', 'MOBIL-10W40', 'Lubrificantes', 'Mobil', 28.00, 20, 5),
('Mangueira Hidráulica 1/2"', 'MAN-H12', 'PARKER-H12', 'Hidráulica', 'Parker', 85.00, 8, 2)
ON CONFLICT (codigo_interno) DO NOTHING;

-- 17. Insert sample data for services catalog
INSERT INTO public.services_catalog (nome, descricao, tipo, categoria, tempo_padrao_minutos, valor_servico) VALUES
('Troca de Rolamento', 'Substituição de rolamento danificado', 'CORRETIVO', 'MECANICA', 120, 150.00),
('Troca de Correia', 'Substituição de correia desgastada', 'CORRETIVO', 'MECANICA', 60, 80.00),
('Lubrificação Geral', 'Lubrificação completa do equipamento', 'PREVENTIVO', 'LUBRIFICACAO', 45, 50.00),
('Inspeção Elétrica', 'Verificação do sistema elétrico', 'PREVENTIVO', 'ELETRICA', 30, 40.00),
('Ajuste de Alinhamento', 'Correção de alinhamento de eixos', 'CORRETIVO', 'AJUSTE', 90, 100.00);
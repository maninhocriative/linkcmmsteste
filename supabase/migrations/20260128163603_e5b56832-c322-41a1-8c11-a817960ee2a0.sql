-- =====================================================
-- 1. NOTIFICATIONS TABLE FOR STOCK ALERTS
-- =====================================================
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL, -- 'ESTOQUE_BAIXO', 'LEAD_TIME_ALERTA', etc.
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    referencia_id UUID, -- part_catalog_id, work_order_id, etc.
    referencia_tipo TEXT, -- 'PECA', 'OS', etc.
    lido BOOLEAN DEFAULT false,
    usuario_destino_id UUID, -- NULL = todos os admins/técnicos
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notifications"
ON public.notifications FOR SELECT
USING (usuario_destino_id IS NULL OR usuario_destino_id = auth.uid() OR has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Authenticated users can update their notifications"
ON public.notifications FOR UPDATE
USING (usuario_destino_id = auth.uid() OR has_role(auth.uid(), 'ADMIN'::app_role));

-- =====================================================
-- 2. WORK ORDER CHECKLIST EXECUTION TABLE
-- =====================================================
CREATE TABLE public.work_order_checklist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.maintenance_plan_items(id),
    item_number TEXT,
    componente TEXT NOT NULL,
    ponto_verificacao TEXT NOT NULL,
    tipo_procedimento tipo_procedimento NOT NULL DEFAULT 'VISUAL',
    concluido BOOLEAN DEFAULT false,
    observacao TEXT,
    tecnico_id UUID,
    tecnico_nome TEXT,
    data_execucao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_order_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Technicians can manage work order checklist"
ON public.work_order_checklist FOR ALL
USING (has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'MANUTENCAO'::app_role));

CREATE POLICY "Anyone authenticated can view work order checklist"
ON public.work_order_checklist FOR SELECT
USING (true);

CREATE TRIGGER update_work_order_checklist_updated_at
BEFORE UPDATE ON public.work_order_checklist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. ENHANCED STOCK TRIGGER WITH NOTIFICATIONS
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_stock_on_part_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_stock integer;
    min_stock integer;
    part_name text;
    lead_time integer;
BEGIN
    IF NEW.part_catalog_id IS NOT NULL THEN
        -- Get current stock and part info
        SELECT estoque_atual, estoque_minimo, nome, prazo_medio_entrega 
        INTO current_stock, min_stock, part_name, lead_time
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
        
        -- Check for low stock alert
        IF (current_stock - NEW.quantidade) <= min_stock THEN
            INSERT INTO public.notifications (
                tipo,
                titulo,
                mensagem,
                referencia_id,
                referencia_tipo
            ) VALUES (
                'ESTOQUE_BAIXO',
                'ATENÇÃO: Estoque Baixo - ' || part_name,
                'ATENÇÃO: Iniciar compra de ' || part_name || '. Lead time de ' || COALESCE(lead_time, 0) || ' dias. Estoque atual: ' || (current_stock - NEW.quantidade) || ' unidades.',
                NEW.part_catalog_id,
                'PECA'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- =====================================================
-- 4. INSERT SAMPLE MAINTENANCE TEMPLATES
-- =====================================================
INSERT INTO public.maintenance_plan_templates (nome, modelo_equipamento, descricao, status)
VALUES 
    ('Manutenção Preventiva - CNC Fresadora', 'CNC Fresadora Vertical', 'Checklist padrão para manutenção preventiva de fresadoras CNC verticais', 'ativo'),
    ('Manutenção Preventiva - Prensa Hidráulica', 'Prensa Hidráulica 200T', 'Checklist para manutenção preventiva de prensas hidráulicas', 'ativo'),
    ('Manutenção Preventiva - Robô de Solda', 'Robô FANUC', 'Checklist para manutenção preventiva de robôs de solda FANUC', 'ativo')
ON CONFLICT DO NOTHING;

-- Insert checklist items for CNC template
INSERT INTO public.maintenance_plan_items (template_id, item_number, componente, ponto_verificacao, frequencia, tipo_procedimento, instrucoes, ordem)
SELECT 
    t.id,
    item_data.item_number,
    item_data.componente,
    item_data.ponto_verificacao,
    item_data.frequencia::frequencia_manutencao,
    item_data.tipo_procedimento::tipo_procedimento,
    item_data.instrucoes,
    item_data.ordem
FROM public.maintenance_plan_templates t
CROSS JOIN (VALUES
    ('1.1', 'Sistema de Lubrificação', 'Nível de óleo do reservatório', 'DIARIO', 'VISUAL', 'Verificar nível no visor. Completar se necessário.', 1),
    ('1.2', 'Sistema de Lubrificação', 'Vazamentos nas linhas de óleo', 'DIARIO', 'VISUAL', 'Inspecionar todas as conexões e mangueiras.', 2),
    ('2.1', 'Guias Lineares', 'Limpeza e lubrificação', 'SEMANAL', 'LUBRIFICACAO', 'Limpar com pano e aplicar óleo específico.', 3),
    ('2.2', 'Guias Lineares', 'Folgas e desgaste', 'MENSAL', 'MEDICAO', 'Usar relógio comparador para medir folgas.', 4),
    ('3.1', 'Fuso de Esferas', 'Verificar ruído', 'SEMANAL', 'TESTE', 'Girar manualmente e ouvir por ruídos anormais.', 5),
    ('3.2', 'Fuso de Esferas', 'Lubrificação', 'MENSAL', 'LUBRIFICACAO', 'Aplicar graxa específica nos pontos indicados.', 6),
    ('4.1', 'Spindle', 'Temperatura de operação', 'DIARIO', 'MEDICAO', 'Medir com termômetro infravermelho após 30min.', 7),
    ('4.2', 'Spindle', 'Vibração', 'MENSAL', 'TESTE', 'Usar analisador de vibração nos mancais.', 8),
    ('5.1', 'Sistema Pneumático', 'Pressão do ar', 'DIARIO', 'VISUAL', 'Verificar manômetro. Ajustar se necessário.', 9),
    ('5.2', 'Sistema Pneumático', 'Filtros de ar', 'SEMANAL', 'VISUAL', 'Drenar água e verificar contaminação.', 10),
    ('6.1', 'Painel Elétrico', 'Ventilação e temperatura', 'SEMANAL', 'VISUAL', 'Verificar filtros e funcionamento dos coolers.', 11),
    ('6.2', 'Painel Elétrico', 'Conexões elétricas', 'TRIMESTRAL', 'VISUAL', 'Verificar aperto de bornes e terminais.', 12)
) AS item_data(item_number, componente, ponto_verificacao, frequencia, tipo_procedimento, instrucoes, ordem)
WHERE t.nome = 'Manutenção Preventiva - CNC Fresadora'
ON CONFLICT DO NOTHING;

-- Insert checklist items for Prensa template
INSERT INTO public.maintenance_plan_items (template_id, item_number, componente, ponto_verificacao, frequencia, tipo_procedimento, instrucoes, ordem)
SELECT 
    t.id,
    item_data.item_number,
    item_data.componente,
    item_data.ponto_verificacao,
    item_data.frequencia::frequencia_manutencao,
    item_data.tipo_procedimento::tipo_procedimento,
    item_data.instrucoes,
    item_data.ordem
FROM public.maintenance_plan_templates t
CROSS JOIN (VALUES
    ('1.1', 'Sistema Hidráulico', 'Nível de óleo', 'DIARIO', 'VISUAL', 'Verificar nível no reservatório.', 1),
    ('1.2', 'Sistema Hidráulico', 'Temperatura do óleo', 'DIARIO', 'MEDICAO', 'Máximo 60°C em operação normal.', 2),
    ('1.3', 'Sistema Hidráulico', 'Vazamentos', 'DIARIO', 'VISUAL', 'Inspecionar mangueiras e conexões.', 3),
    ('2.1', 'Cilindro Principal', 'Vedações', 'SEMANAL', 'VISUAL', 'Verificar vazamentos nas vedações.', 4),
    ('2.2', 'Cilindro Principal', 'Haste', 'MENSAL', 'VISUAL', 'Verificar riscos ou corrosão na haste.', 5),
    ('3.1', 'Dispositivos de Segurança', 'Cortina de luz', 'DIARIO', 'TESTE', 'Testar funcionamento antes de operar.', 6),
    ('3.2', 'Dispositivos de Segurança', 'Bi-manual', 'DIARIO', 'TESTE', 'Testar sincronismo dos botões.', 7),
    ('4.1', 'Estrutura', 'Parafusos de fixação', 'MENSAL', 'VISUAL', 'Verificar torque dos parafusos principais.', 8)
) AS item_data(item_number, componente, ponto_verificacao, frequencia, tipo_procedimento, instrucoes, ordem)
WHERE t.nome = 'Manutenção Preventiva - Prensa Hidráulica'
ON CONFLICT DO NOTHING;

-- Insert checklist items for Robô template
INSERT INTO public.maintenance_plan_items (template_id, item_number, componente, ponto_verificacao, frequencia, tipo_procedimento, instrucoes, ordem)
SELECT 
    t.id,
    item_data.item_number,
    item_data.componente,
    item_data.ponto_verificacao,
    item_data.frequencia::frequencia_manutencao,
    item_data.tipo_procedimento::tipo_procedimento,
    item_data.instrucoes,
    item_data.ordem
FROM public.maintenance_plan_templates t
CROSS JOIN (VALUES
    ('1.1', 'Cabos e Conexões', 'Mangueira de solda', 'DIARIO', 'VISUAL', 'Verificar desgaste e danos.', 1),
    ('1.2', 'Cabos e Conexões', 'Cabos de energia', 'SEMANAL', 'VISUAL', 'Verificar isolamento e conexões.', 2),
    ('2.1', 'Redutor', 'Ruído', 'SEMANAL', 'TESTE', 'Ouvir por ruídos anormais nos eixos.', 3),
    ('2.2', 'Redutor', 'Graxa', 'SEMESTRAL', 'TROCA', 'Substituir graxa conforme manual.', 4),
    ('3.1', 'Tocha de Solda', 'Bico de contato', 'DIARIO', 'VISUAL', 'Verificar desgaste. Trocar se necessário.', 5),
    ('3.2', 'Tocha de Solda', 'Bocal', 'DIARIO', 'LIMPEZA', 'Limpar respingos acumulados.', 6),
    ('4.1', 'Encoder', 'Calibração', 'TRIMESTRAL', 'TESTE', 'Verificar precisão de posicionamento.', 7),
    ('5.1', 'Freios', 'Funcionamento', 'MENSAL', 'TESTE', 'Testar freio de cada eixo.', 8)
) AS item_data(item_number, componente, ponto_verificacao, frequencia, tipo_procedimento, instrucoes, ordem)
WHERE t.nome = 'Manutenção Preventiva - Robô de Solda'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. INSERT SAMPLE PARTS CATALOG
-- =====================================================
INSERT INTO public.parts_catalog (nome, codigo_interno, codigo_fabricante, categoria, fornecedor_padrao, valor_medio, prazo_medio_entrega, estoque_atual, estoque_minimo, unidade_medida, status)
VALUES 
    ('Rolamento 6205 2RS', 'ROL-6205', 'SKF-6205-2RS', 'Rolamentos', 'SKF Brasil', 45.00, 7, 15, 5, 'UN', 'ativo'),
    ('Óleo Hidráulico ISO 68', 'OLE-HID-68', 'MOBIL-DTE-26', 'Lubrificantes', 'Mobil', 120.00, 3, 40, 10, 'LT', 'ativo'),
    ('Graxa MP2', 'GRX-MP2', 'SHELL-ALVANIA', 'Lubrificantes', 'Shell', 85.00, 5, 8, 3, 'KG', 'ativo'),
    ('Correia Sincronizadora HTD 5M', 'COR-HTD-5M', 'GATES-HTD-5M', 'Transmissão', 'Gates', 180.00, 14, 6, 2, 'UN', 'ativo'),
    ('Fusível NH 100A', 'FUS-NH-100', 'SIEMENS-NH100', 'Elétrico', 'Siemens', 25.00, 2, 20, 10, 'UN', 'ativo'),
    ('Contator 3RT 40A', 'CON-3RT-40', 'SIEMENS-3RT2026', 'Elétrico', 'Siemens', 320.00, 10, 4, 2, 'UN', 'ativo'),
    ('Filtro de Ar Comprimido', 'FIL-AR-01', 'PARKER-P32', 'Pneumático', 'Parker', 95.00, 7, 12, 4, 'UN', 'ativo'),
    ('Vedação Cilindro Hidráulico', 'VED-CIL-01', 'TRELLEBORG-01', 'Hidráulico', 'Trelleborg', 150.00, 21, 3, 2, 'KIT', 'ativo'),
    ('Bico de Contato MIG 1.0mm', 'BIC-MIG-10', 'ESAB-BCM10', 'Solda', 'ESAB', 8.50, 3, 50, 20, 'UN', 'ativo'),
    ('Bocal Conico Tocha MIG', 'BOC-MIG-01', 'ESAB-BCO01', 'Solda', 'ESAB', 35.00, 3, 15, 5, 'UN', 'ativo')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. INSERT SAMPLE ASSETS
-- =====================================================
INSERT INTO public.assets (qr_code_value, nome, codigo_interno, setor_padrao, local_padrao, tag, modelo, fabricante, status)
VALUES 
    ('HONDA-CNC-001', 'CNC Fresadora Vertical', 'CNC-FV-001', 'Produção', 'Linha A', 'EQ-001', 'VMC-850', 'Mazak', 'ativo'),
    ('HONDA-PRENSA-002', 'Prensa Hidráulica 200T', 'PH-200-002', 'Estamparia', 'Célula 3', 'EQ-002', 'PH-200', 'Schuler', 'ativo'),
    ('HONDA-ROBO-003', 'Robô de Solda FANUC', 'RS-FANUC-003', 'Soldagem', 'Estação 5', 'EQ-003', 'ARC Mate 100iD', 'FANUC', 'ativo'),
    ('HONDA-TORNO-004', 'Torno CNC', 'TORNO-CNC-004', 'Usinagem', 'Linha B', 'EQ-004', 'SL-20', 'Haas', 'ativo'),
    ('HONDA-COMPRESSOR-005', 'Compressor de Ar', 'COMP-AR-005', 'Utilidades', 'Casa de Máquinas', 'EQ-005', 'GA-30', 'Atlas Copco', 'ativo')
ON CONFLICT DO NOTHING;
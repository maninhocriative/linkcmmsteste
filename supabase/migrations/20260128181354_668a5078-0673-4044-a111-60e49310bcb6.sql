-- Criar catálogo de pontos de verificação
CREATE TABLE public.verification_points_catalog (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    descricao text,
    categoria text,
    status text DEFAULT 'ativo',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_points_catalog ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can view verification points" 
ON public.verification_points_catalog 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and technicians can manage verification points" 
ON public.verification_points_catalog 
FOR ALL 
USING (has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'MANUTENCAO'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_verification_points_updated_at
BEFORE UPDATE ON public.verification_points_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert common verification points
INSERT INTO public.verification_points_catalog (nome, categoria) VALUES
('Nível de óleo do reservatório', 'Lubrificação'),
('Vazamentos nas linhas de óleo', 'Lubrificação'),
('Verificar desgaste', 'Inspeção Visual'),
('Verificar alinhamento', 'Ajuste'),
('Limpeza geral', 'Limpeza'),
('Verificar fixação dos parafusos', 'Inspeção Visual'),
('Testar funcionamento', 'Teste'),
('Medir pressão', 'Medição'),
('Verificar ruídos anormais', 'Inspeção Visual'),
('Lubrificar componentes móveis', 'Lubrificação'),
('Verificar temperatura de operação', 'Medição'),
('Inspecionar conexões elétricas', 'Inspeção Visual'),
('Verificar estado das correias', 'Inspeção Visual'),
('Trocar filtros', 'Troca'),
('Verificar folgas', 'Ajuste');
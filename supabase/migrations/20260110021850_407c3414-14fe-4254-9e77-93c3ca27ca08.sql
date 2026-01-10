-- Create role enum
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'MANUTENCAO', 'OPERACAO');

-- Create availability enum
CREATE TYPE public.disponibilidade AS ENUM ('DISPONIVEL', 'OCUPADO');

-- Create status enum
CREATE TYPE public.os_status AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'FECHADO');

-- Create priority enum
CREATE TYPE public.prioridade AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- Create occurrence type enum
CREATE TYPE public.tipo_ocorrencia AS ENUM ('QUEBRA', 'FALHA_INTERMITENTE', 'PECA_DANIFICADA', 'RUIDO', 'VAZAMENTO', 'OUTRO');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'OPERACAO',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    matricula TEXT,
    disponibilidade disponibilidade NOT NULL DEFAULT 'DISPONIVEL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Assets table (equipamentos)
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_value TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    codigo_interno TEXT NOT NULL,
    setor_padrao TEXT,
    local_padrao TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Work orders table
CREATE TABLE public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo TEXT UNIQUE NOT NULL,
    asset_id UUID REFERENCES public.assets(id) NOT NULL,
    setor TEXT NOT NULL,
    local TEXT,
    tipo_ocorrencia tipo_ocorrencia NOT NULL,
    prioridade prioridade NOT NULL,
    descricao_solicitante TEXT NOT NULL,
    foto_solicitante_url TEXT,
    solicitante_id UUID REFERENCES auth.users(id),
    solicitante_nome TEXT NOT NULL,
    status os_status NOT NULL DEFAULT 'ABERTO',
    tecnico_id UUID REFERENCES auth.users(id),
    diagnostico TEXT,
    acao_corretiva TEXT,
    acao_preventiva TEXT,
    tempo_gasto TEXT,
    evidencia_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on work_orders
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Parts used table
CREATE TABLE public.parts_used (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
    item TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    codigo_peca TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on parts_used
ALTER TABLE public.parts_used ENABLE ROW LEVEL SECURITY;

-- Function to generate protocol number
CREATE OR REPLACE FUNCTION public.generate_protocolo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocolo FROM 4) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.work_orders;
    
    NEW.protocolo := 'OS-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

-- Trigger to auto-generate protocol
CREATE TRIGGER generate_protocolo_trigger
    BEFORE INSERT ON public.work_orders
    FOR EACH ROW
    WHEN (NEW.protocolo IS NULL)
    EXECUTE FUNCTION public.generate_protocolo();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, nome)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'OPERACAO');
    
    RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- User roles: users can see their own role, admins can see all
CREATE POLICY "Users can view their own role"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));

-- Profiles: users can view all profiles, update their own
CREATE POLICY "Anyone authenticated can view profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Assets: all authenticated users can view
CREATE POLICY "Anyone authenticated can view assets"
    ON public.assets
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage assets"
    ON public.assets
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

-- Work orders: different access levels
CREATE POLICY "Users can view all work orders"
    ON public.work_orders
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone authenticated can create work orders"
    ON public.work_orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Technicians can update work orders"
    ON public.work_orders
    FOR UPDATE
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'ADMIN') OR 
        public.has_role(auth.uid(), 'MANUTENCAO') OR
        tecnico_id = auth.uid()
    );

-- Parts used: follow work order access
CREATE POLICY "Users can view parts"
    ON public.parts_used
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Technicians can manage parts"
    ON public.parts_used
    FOR ALL
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'ADMIN') OR 
        public.has_role(auth.uid(), 'MANUTENCAO')
    );

-- Insert sample assets
INSERT INTO public.assets (qr_code_value, nome, codigo_interno, setor_padrao, local_padrao, status)
VALUES 
    ('HONDA-CNC-001', 'CNC Fresadora Vertical', 'CNC-FV-001', 'Produção', 'Linha A', 'ativo'),
    ('HONDA-PRENSA-002', 'Prensa Hidráulica 200T', 'PH-200-002', 'Estamparia', 'Célula 3', 'ativo'),
    ('HONDA-ROBO-003', 'Robô de Solda FANUC', 'RS-FANUC-003', 'Soldagem', 'Estação 5', 'ativo');
-- Fix security warnings: update trigger functions with proper search_path

-- Drop and recreate generate_protocolo with search_path
CREATE OR REPLACE FUNCTION public.generate_protocolo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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

-- Drop and recreate update_updated_at_column with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
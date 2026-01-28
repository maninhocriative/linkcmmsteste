
-- Update the handle_new_user function to assign ADMIN role to the master admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    assigned_role app_role;
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (user_id, nome)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
    
    -- Check if this is the admin master email
    IF NEW.email = 'maninhoscriativos@gmail.com' THEN
        assigned_role := 'ADMIN';
    ELSE
        assigned_role := 'OPERACAO';
    END IF;
    
    -- Insert user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);
    
    RETURN NEW;
END;
$$;

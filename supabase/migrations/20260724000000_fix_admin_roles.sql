-- Auto-promove o primeiro usuário (ou qualquer um que não tenha role) a admin
-- Isso resolve o problema de quem já tinha conta antes da migration
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Pega o primeiro usuário que não tem nenhuma role
  SELECT id INTO first_user_id
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM public.user_roles)
  ORDER BY created_at ASC
  LIMIT 1;

  IF first_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (first_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Atualiza o trigger para auto-promover o primeiro usuário e emails específicos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count bigint;
BEGIN
  -- Conta usuários existentes
  SELECT count(*) INTO user_count FROM auth.users;

  INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email));

  -- Admin: primeiro usuário, emails específicos, ou quem já tinha role de admin
  IF user_count <= 1
     OR lower(new.email) IN ('contato@pratazjoias.com.br', 'fcostachaves@gmail.com')
     OR public.has_role(new.id, 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'cliente') ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END $$;

-- Função para admin promover outros usuários
CREATE OR REPLACE FUNCTION public.promote_user(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Só admin pode promover
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem promover usuários';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

GRANT EXECUTE ON FUNCTION public.promote_user(uuid, public.app_role) TO authenticated;

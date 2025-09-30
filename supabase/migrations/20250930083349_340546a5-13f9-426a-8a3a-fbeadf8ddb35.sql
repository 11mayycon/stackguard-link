-- Criar função para inserir perfil com CPF
CREATE OR REPLACE FUNCTION public.create_profile_with_cpf(
  p_cpf text,
  p_nome_completo text,
  p_role text DEFAULT 'funcionario'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_profile_id uuid;
  result json;
BEGIN
  -- Inserir novo perfil
  INSERT INTO public.profiles (cpf, nome_completo, role)
  VALUES (p_cpf, p_nome_completo, p_role)
  RETURNING id INTO new_profile_id;
  
  -- Retornar resultado
  result := json_build_object(
    'success', true,
    'profile_id', new_profile_id,
    'message', 'Perfil criado com sucesso'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar perfil: %', SQLERRM;
END;
$$;
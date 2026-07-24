-- Sistema de múltiplas agendas (estilo Google Agenda): cada agenda é um
-- agrupamento próprio de eventos, com nome/cor, que pode ser ligado/desligado
-- da visualização. Todo evento existente é migrado para uma agenda "Pessoal"
-- criada automaticamente por usuário — nenhum dado é perdido.

CREATE TABLE public.agendas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#0EA5E9',
  eh_padrao boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agendas_pkey PRIMARY KEY (id)
);

ALTER TABLE public.agendas ADD CONSTRAINT agendas_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_agendas_user_id ON public.agendas USING btree (user_id);

-- Só uma agenda pode ser a padrão por usuário.
CREATE UNIQUE INDEX agendas_user_padrao_uniq ON public.agendas (user_id) WHERE eh_padrao;

ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.agendas AS PERMISSIVE FOR ALL TO public
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- calendar_events passa a pertencer a uma agenda. ON DELETE SET NULL como rede
-- de segurança — o fluxo normal do app sempre reatribui ou apaga os eventos
-- antes de excluir a agenda, então isso só entra em jogo se algo pular essa
-- etapa (nunca deve deixar o evento "sem dono" de fato, já que user_id
-- continua intacto).
ALTER TABLE public.calendar_events ADD COLUMN agenda_id uuid;
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_agenda_id_fkey
  FOREIGN KEY (agenda_id) REFERENCES public.agendas(id) ON DELETE SET NULL;
CREATE INDEX idx_calendar_events_agenda_id ON public.calendar_events USING btree (agenda_id);

-- Cria a agenda "Pessoal" (padrão) para cada usuário que já existe hoje.
INSERT INTO public.agendas (user_id, nome, cor, eh_padrao, ordem)
SELECT u.id, 'Pessoal', '#0EA5E9', true, 0
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.agendas a WHERE a.user_id = u.id);

-- Migra todos os calendar_events existentes pra agenda Pessoal do próprio dono.
UPDATE public.calendar_events ce
SET agenda_id = a.id
FROM public.agendas a
WHERE a.user_id = ce.user_id AND a.eh_padrao = true AND ce.agenda_id IS NULL;

-- Novos usuários (signup após este deploy): cria a agenda Pessoal automaticamente.
CREATE OR REPLACE FUNCTION public.handle_new_user_agenda()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agendas (user_id, nome, cor, eh_padrao, ordem)
  VALUES (NEW.id, 'Pessoal', '#0EA5E9', true, 0)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_agenda ON auth.users;
CREATE TRIGGER on_auth_user_created_agenda
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_agenda();

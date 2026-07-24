-- Esportes: corrige o mapeamento Strava que classificava bike/natação como
-- triathlon (kind 'bike'/'natação' era o único jeito de diferenciar, já que
-- 'ciclismo'/'natacao' nunca eram usados como sport de verdade — corrigido no
-- código do strava-sync). Backfill dos registros já importados com esse bug.
-- Também adiciona activity_name (nome original da atividade no Strava, ex.
-- "Morning Run") — usado no redesign visual da listagem de treinos.

ALTER TABLE public.sports ADD COLUMN activity_name text;

UPDATE public.sports
SET sport = 'ciclismo'
WHERE sport = 'triathlon' AND kind = 'bike';

UPDATE public.sports
SET sport = 'natacao'
WHERE sport = 'triathlon' AND kind = 'natação';

-- ============================================================
-- FIX M24 — bucket "systems" era público (public=true) e servia
-- arquivos via CDN sem checar RLS. Além disso, não havia NENHUMA
-- policy para o bucket em storage.objects (SELECT/INSERT/UPDATE/
-- DELETE), então uploads já estavam quebrados silenciosamente
-- (RLS habilitado + zero policies = deny by default).
--
-- O path real usado pelo app é {folder}/{timestamp}_{random}.ext
-- (thumbnails/... ou files/...), sem prefixo de user_id — é um
-- app single-tenant (só o Jean usa o módulo "sistemas", que é
-- hidden/admin). Por isso a policy é "authenticated" e não
-- owner-per-folder.
-- ============================================================

UPDATE storage.buckets SET public = false WHERE id = 'systems';

DROP POLICY IF EXISTS systems_public_read ON storage.objects;
DROP POLICY IF EXISTS systems_upload ON storage.objects;
DROP POLICY IF EXISTS systems_delete ON storage.objects;

CREATE POLICY systems_authenticated_select ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'systems');

CREATE POLICY systems_authenticated_insert ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'systems');

CREATE POLICY systems_authenticated_update ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'systems')
WITH CHECK (bucket_id = 'systems');

CREATE POLICY systems_authenticated_delete ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'systems');

INSERT INTO storage.buckets (id, name, public)
VALUES ('notas-imagens', 'notas-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (bucket público), escrita restrita ao dono via
-- convenção de path "<user_id>/<arquivo>" (mesmo padrão de covers_delete,
-- mas aplicado também a INSERT/UPDATE — o bucket "covers" deixa esses dois
-- abertos pra qualquer autenticado; aqui restringimos por pasta desde já).
CREATE POLICY notas_imagens_select ON storage.objects
  FOR SELECT USING (bucket_id = 'notas-imagens');

CREATE POLICY notas_imagens_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'notas-imagens'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY notas_imagens_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'notas-imagens'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY notas_imagens_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'notas-imagens'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

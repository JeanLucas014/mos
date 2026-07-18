import { supabase } from '@/lib/supabase'

/** Faz upload de uma imagem pro bucket notas-imagens e retorna a URL
 * pública — nunca salvamos base64 inline no conteúdo da nota. */
export async function uploadNoteImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('notas-imagens').upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error

  const { data } = supabase.storage.from('notas-imagens').getPublicUrl(path)
  return data.publicUrl
}

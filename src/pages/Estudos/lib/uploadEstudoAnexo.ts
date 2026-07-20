import { supabase } from '@/lib/supabase'

const SIGNED_URL_TTL = 60 * 60 // 1h — mesmo padrão do bucket privado "systems"

/** Bucket "estudos-anexos" é privado — armazenamos o path e resolvemos uma
 * signed URL sob demanda, nunca uma URL pública (anexos podem ser
 * documentos pessoais). */
export async function uploadEstudoAnexo(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('estudos-anexos').upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error
  return path
}

export async function resolveEstudoAnexoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('estudos-anexos').createSignedUrl(path, SIGNED_URL_TTL)
  if (error) return null
  return data.signedUrl
}

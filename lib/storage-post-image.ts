import { supabase } from "@/lib/supabase"

/**
 * Must match the Storage bucket **id** in Supabase (Dashboard → Storage).
 * Use NEXT_PUBLIC_SUPABASE_POST_IMAGES_BUCKET if it differs from the default.
 * Avoid spaces in bucket ids when possible (URLs encode them as %20).
 */
export const POST_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_POST_IMAGES_BUCKET?.trim() || "post-images"

/** Assessment: JPEG/PNG, max 2MB */
export const POST_IMAGE_MAX_BYTES = 2 * 1024 * 1024

export const POST_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png"] as const

export function validatePostImageFile(file: File): string | null {
  if (
    !POST_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof POST_IMAGE_ALLOWED_TYPES)[number])
  ) {
    return "Use a JPEG or PNG image."
  }
  if (file.size > POST_IMAGE_MAX_BYTES) {
    return "Image must be 2MB or smaller."
  }
  return null
}

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  return "bin"
}

/** Upload to `{bucket}/{userId}/{uuid}.ext`; returns public object URL. */
export async function uploadPostImage(
  userId: string,
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  const v = validatePostImageFile(file)
  if (v) return { error: v }

  const path = `${userId}/${crypto.randomUUID()}.${extForMime(file.type)}`
  const { error: upErr } = await supabase.storage.from(POST_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  })

  if (upErr) {
    return { error: upErr.message }
  }

  const { data } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl }
}

/** Accepts public URLs whether the bucket segment is encoded (e.g. social%20images) or not. */
export function isAllowedPostImagePublicUrl(imageUrl: string, supabaseUrl: string): boolean {
  const base = supabaseUrl.replace(/\/$/, "")
  const rawSeg = POST_IMAGES_BUCKET
  const encSeg = encodeURIComponent(POST_IMAGES_BUCKET)
  const prefixes = [
    `${base}/storage/v1/object/public/${rawSeg}/`,
    `${base}/storage/v1/object/public/${encSeg}/`,
  ]
  return prefixes.some((p) => imageUrl.startsWith(p))
}

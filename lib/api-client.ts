import { supabase } from "@/lib/supabase"

export async function apiFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`)
  }
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  return fetch(path, { ...init, headers })
}

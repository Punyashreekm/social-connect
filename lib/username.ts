/** Unique profiles.username: 3–30 chars, [a-zA-Z0-9_]. */
export function usernameFromEmailAndUserId(email: string, userId: string): string {
  const local = (email.split("@")[0] || "user")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
  const idShort = userId.replace(/-/g, "").slice(0, 8)
  let base =
    local.length >= 3 ? local.slice(0, 22) : `user_${local || "x"}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 22)
  if (base.length < 3) base = "usr"
  const combined = `${base}_${idShort}`.slice(0, 30)
  return combined.length >= 3 ? combined : `u_${idShort}`.slice(0, 30)
}

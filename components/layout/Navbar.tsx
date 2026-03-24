"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { apiFetch } from "@/lib/api-client"

export default function Navbar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initial, setInitial] = useState("?")

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        setAvatarUrl(null)
        setInitial("?")
        return
      }
      const res = await apiFetch("/api/profile/me")
      if (!res.ok || cancelled) return
      const j = await res.json()
      const p = j.profile
      if (!p || cancelled) return
      setAvatarUrl(p.avatar_url)
      const n = [p.first_name, p.last_name].filter(Boolean).join(" ").trim()
      setInitial((n || p.username || "?").charAt(0).toUpperCase())
    }

    load()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load()
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50 px-4 flex items-center justify-between">
      <Link href="/dashboard" className="text-lg font-bold tracking-tight">
        SocialConnect
      </Link>
      <Link
        href="/profile"
        className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Profile"
      >
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatarUrl ?? undefined} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      </Link>
    </nav>
  )
}

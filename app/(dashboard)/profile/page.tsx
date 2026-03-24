"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { MapPin, Link as LinkIcon, Calendar, LogOut } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { supabase } from "@/lib/supabase"

type Profile = {
  id: string
  email: string | null
  username: string
  first_name: string | null
  last_name: string | null
  bio: string | null
  avatar_url: string | null
  website: string | null
  location: string | null
  follower_count: number
  following_count: number
  posts_count: number
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [first_name, setFirstName] = useState("")
  const [last_name, setLastName] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")
  const [location, setLocation] = useState("")
  const [avatar_url, setAvatarUrl] = useState("")

  const hydrate = useCallback((p: Profile) => {
    setProfile(p)
    setFirstName(p.first_name ?? "")
    setLastName(p.last_name ?? "")
    setBio(p.bio ?? "")
    setWebsite(p.website ?? "")
    setLocation(p.location ?? "")
    setAvatarUrl(p.avatar_url ?? "")
  }, [])

  const load = useCallback(async () => {
    setError("")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.replace("/login")
      return
    }
    const res = await apiFetch("/api/profile/me")
    if (res.status === 401) {
      router.replace("/login")
      return
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error || "Could not load profile")
      setLoading(false)
      return
    }
    const j = await res.json()
    hydrate(j.profile)
    setAuthEmail(j.authEmail ?? null)
    setLoading(false)
  }, [router, hydrate])

  useEffect(() => {
    load()
  }, [load])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const res = await apiFetch("/api/profile/me", {
        method: "PATCH",
        body: JSON.stringify({
          first_name,
          last_name,
          bio,
          website,
          location,
          avatar_url,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error || "Save failed")
        return
      }
      hydrate(j.profile)
      setMessage("Saved")
    } finally {
      setSaving(false)
    }
  }

  const logout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  if (loading || !profile) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm max-w-xl mx-auto px-4">
        {error || "Loading profile…"}
      </div>
    )
  }

  const display =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.username

  return (
    <div className="pb-24 md:pb-8 max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Home
        </Link>
        <Button variant="outline" size="sm" className="gap-2" onClick={logout} disabled={loggingOut}>
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Signing out…" : "Log out"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
          <AvatarImage src={avatar_url || undefined} className="object-cover" />
          <AvatarFallback className="text-2xl">{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{display}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          <p className="text-sm text-muted-foreground mt-1">{authEmail ?? profile.email}</p>
        </div>
      </div>

      <div className="flex gap-6 text-sm">
        <span>
          <span className="font-semibold text-foreground">{profile.following_count}</span>{" "}
          <span className="text-muted-foreground">Following</span>
        </span>
        <span>
          <span className="font-semibold text-foreground">{profile.follower_count}</span>{" "}
          <span className="text-muted-foreground">Followers</span>
        </span>
        <span>
          <span className="font-semibold text-foreground">{profile.posts_count}</span>{" "}
          <span className="text-muted-foreground">Posts</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" /> {location}
          </span>
        )}
        {website && (
          <span className="flex items-center gap-1.5 min-w-0">
            <LinkIcon className="h-4 w-4 shrink-0" />
            <a href={website.startsWith("http") ? website : `https://${website}`} className="text-primary truncate hover:underline" target="_blank" rel="noreferrer">
              {website}
            </a>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 shrink-0" /> Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">Edit profile</h2>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" value={first_name} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" value={last_name} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input id="avatar_url" type="url" value={avatar_url} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} rows={3} className="resize-none" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yoursite.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  )
}

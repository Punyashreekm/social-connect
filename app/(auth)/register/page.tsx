"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [first_name, setFirstName] = useState("")
  const [last_name, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || "Registration failed")
      }

      if (data.needsEmailConfirmation) {
        setError("Check your email to confirm your account, then sign in.")
        return
      }

      if (data.session) {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        if (sessionErr) throw sessionErr
        router.push("/dashboard")
        router.refresh()
        return
      }

      setError("Could not complete registration.")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-6 text-2xl font-bold text-center">Register</h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" value={first_name} onChange={(e) => setFirstName(e.target.value)} required autoComplete="given-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" value={last_name} onChange={(e) => setLastName(e.target.value)} required autoComplete="family-name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:underline">
            Login here
          </Link>
        </div>
      </Card>
    </div>
  )
}

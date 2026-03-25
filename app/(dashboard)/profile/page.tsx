"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { LogOut, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import {
  AVATAR_MAX_BYTES,
  uploadAvatar,
  validateAvatarFile,
} from "@/lib/storage-avatar";

type Profile = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [avatar_url, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const hydrate = useCallback((p: Profile) => {
    setProfile(p);
    setFirstName(p.first_name ?? "");
    setLastName(p.last_name ?? "");
    setAvatarUrl(p.avatar_url ?? "");
  }, []);

  const load = useCallback(async () => {
    setError("");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    const res = await apiFetch("/api/profile/me");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Could not load profile");
      setLoading(false);
      return;
    }
    const j = await res.json();
    hydrate(j.profile);
    setLoading(false);
  }, [router, hydrate]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await apiFetch("/api/profile/me", {
        method: "PATCH",
        body: JSON.stringify({ first_name, last_name }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Save failed");
        return;
      }
      hydrate(j.profile);
      setMessage("Saved");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;
    const msg = validateAvatarFile(file);
    if (msg) {
      setError(msg);
      setMessage("");
      return;
    }
    setAvatarUploading(true);
    setError("");
    setMessage("");
    try {
      const up = await uploadAvatar(profile.id, file);
      if ("error" in up) {
        setError(up.error);
        return;
      }
      const res = await apiFetch("/api/profile/me", {
        method: "PATCH",
        body: JSON.stringify({ avatar_url: up.publicUrl }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Could not save photo");
        return;
      }
      hydrate(j.profile);
      setMessage("Photo updated");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm max-w-md mx-auto px-4">
        {error || "Loading…"}
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8 max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Home
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={logout}
          disabled={loggingOut}
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Signing out…" : "Log out"}
        </Button>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>

        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <form onSubmit={save} className="space-y-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <Avatar className="h-28 w-28 border-2 border-border shadow-sm shrink-0">
              <AvatarImage
                src={avatar_url || undefined}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 w-full sm:flex-1 text-center sm:text-left">
              <Label className="text-muted-foreground">Profile picture</Label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={onAvatarFile}
              />
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  disabled={avatarUploading}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {avatarUploading ? "Uploading…" : "Upload photo"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG or PNG · max{" "}
                {(AVATAR_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB · saves when
                uploaded
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                value={first_name}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                value={last_name}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save name"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

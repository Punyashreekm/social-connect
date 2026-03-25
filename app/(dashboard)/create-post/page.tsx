"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreatePost from "@/components/post/CreatePost";
import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

type MeProfile = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export default function CreatePostPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const res = await apiFetch("/api/profile/me");
    if (!res.ok) return;
    const j = await res.json();
    setMe(j.profile);
    setUserId(j.profile?.id ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      await loadMe();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, loadMe]);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm max-w-xl mx-auto">
        Loading…
      </div>
    );
  }

  return (
    <div className="py-4 sm:px-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold px-4 sm:px-0 mb-4 md:hidden">Create Post</h1>
      <h1 className="hidden md:block text-2xl font-bold mb-6">Create Post</h1>
      <CreatePost
        userId={userId}
        me={
          me
            ? {
                first_name: me.first_name,
                last_name: me.last_name,
                username: me.username,
                avatar_url: me.avatar_url,
              }
            : null
        }
        onPosted={() => router.push("/dashboard")}
      />
    </div>
  );
}

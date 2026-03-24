"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreatePost from "@/components/post/CreatePost";
import PostCard, { type FeedPost } from "@/components/post/PostCard";
import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

type MeProfile = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export default function DashboardFeed() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [me, setMe] = useState<MeProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const res = await apiFetch("/api/profile/me");
    if (!res.ok) return;
    const j = await res.json();
    setMe(j.profile);
    setUserId(j.profile?.id ?? null);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoadError("");
    const res = await apiFetch("/api/posts");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setLoadError(j.error || "Failed to load feed");
      return;
    }
    const j = await res.json();
    setPosts(j.posts ?? []);
  }, [router]);

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
      await Promise.all([loadMe(), loadPosts()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, loadMe, loadPosts]);

  const refresh = useCallback(() => {
    loadPosts();
    loadMe();
  }, [loadPosts, loadMe]);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm max-w-xl mx-auto">
        Loading feed…
      </div>
    );
  }

  return (
    <div className="py-4 sm:px-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold px-4 sm:px-0 mb-4 md:hidden">Home</h1>
      {loadError && (
        <p className="text-sm text-destructive px-4 sm:px-0 mb-2">
          {loadError}
        </p>
      )}
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
        onPosted={refresh}
      />
      <div className="mt-4">
        {posts.length === 0 && !loadError && (
          <p className="text-center text-muted-foreground text-sm py-8 px-4">
            No posts yet. Say hello!
          </p>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={userId}
            onChanged={refresh}
          />
        ))}
      </div>
    </div>
  );
}

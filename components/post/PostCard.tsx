"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/time";
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

export type FeedAuthor = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type FeedPost = {
  id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author_id: string;
  author: FeedAuthor;
  liked_by_me: boolean;
  author_followed_by_me: boolean;
};

function displayName(author: FeedAuthor) {
  const n = [author.first_name, author.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return n || author.username;
}

export default function PostCard({
  post,
  currentUserId,
  onChanged,
}: {
  post: FeedPost;
  currentUserId: string | null;
  onChanged?: () => void;
}) {
  const author = post.author;
  const isOwn = currentUserId != null && post.author_id === currentUserId;

  const toggleLike = async () => {
    const method = post.liked_by_me ? "DELETE" : "POST";
    const res = await apiFetch(`/api/posts/${post.id}/like`, { method });
    if (!res.ok) return;
    onChanged?.();
  };

  const toggleFollow = async () => {
    if (post.author_followed_by_me) {
      const res = await apiFetch(
        `/api/follows?following_id=${encodeURIComponent(post.author_id)}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) return;
    } else {
      const res = await apiFetch("/api/follows", {
        method: "POST",
        body: JSON.stringify({ following_id: post.author_id }),
      });
      if (!res.ok) return;
    }
    onChanged?.();
  };

  return (
    <Card className="p-4 rounded-none sm:rounded-xl border-x-0 sm:border mb-4 bg-background shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="shrink-0">
            <AvatarImage src={author.avatar_url ?? undefined} />
            <AvatarFallback>
              {author.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              {displayName(author)}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{author.username} · {formatTimeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isOwn && currentUserId && (
            <Button
              variant={post.author_followed_by_me ? "secondary" : "default"}
              size="sm"
              className="rounded-full h-8 text-xs gap-1"
              onClick={toggleFollow}
            >
              {post.author_followed_by_me ? (
                <>
                  <UserMinus className="h-3.5 w-3.5" /> Following
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" /> Follow
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4 border bg-muted">
          <img
            src={post.image_url}
            alt=""
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-2 mt-2 border-t text-muted-foreground">
        <Button
          variant="ghost"
          className={`flex-1 flex gap-2 rounded-lg ${
            post.liked_by_me ? "text-red-500" : ""
          } hover:text-red-500 hover:bg-red-50`}
          onClick={toggleLike}
          disabled={!currentUserId}
        >
          <Heart
            className={`h-5 w-5 ${post.liked_by_me ? "fill-current" : ""}`}
          />{" "}
          {post.like_count}
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex gap-2 rounded-lg hover:text-blue-500 hover:bg-blue-50"
          asChild
        >
          <Link href={`/posts/${post.id}`}>
            <MessageCircle className="h-5 w-5" /> {post.comment_count}
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex gap-2 rounded-lg hover:text-green-500 hover:bg-green-50"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}

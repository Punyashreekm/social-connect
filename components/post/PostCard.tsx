import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react'

export default function PostCard({ post }: { post: any }) {
  return (
    <Card className="p-4 rounded-none sm:rounded-xl border-x-0 sm:border mb-4 bg-background shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.author.avatarUrl} />
            <AvatarFallback>{post.author.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm hover:underline cursor-pointer">{post.author.username}</p>
            <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      
      <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
      
      {post.imageUrl && (
        <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4 border bg-muted">
          <img
            src={post.imageUrl}
            alt="Post content"
            className="object-cover w-full h-full"
          />
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 mt-4 border-t text-muted-foreground">
        <Button variant="ghost" className="flex-1 flex gap-2 rounded-lg hover:text-red-500 hover:bg-red-50">
          <Heart className="h-5 w-5" /> {post.likes}
        </Button>
        <Button variant="ghost" className="flex-1 flex gap-2 rounded-lg hover:text-blue-500 hover:bg-blue-50">
          <MessageCircle className="h-5 w-5" /> {post.comments}
        </Button>
        <Button variant="ghost" className="flex-1 flex gap-2 rounded-lg hover:text-green-500 hover:bg-green-50">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  )
}

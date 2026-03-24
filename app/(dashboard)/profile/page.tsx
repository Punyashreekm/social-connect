import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import PostCard from '@/components/post/PostCard'
import { MapPin, Link as LinkIcon, Calendar, Mail } from 'lucide-react'

export default function ProfilePage() {
  const dummyUser = {
    username: "alex_dev",
    name: "Alex Developer",
    bio: "Frontend Developer | Next.js enthusiast | Building modern web apps 🚀\nPassionate about clean code and great UX.",
    location: "San Francisco, CA",
    website: "alexdev.io",
    joined: "March 2026",
    followers: 1240,
    following: 384,
    avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=500&auto=format&fit=crop"
  }

  const dummyPost = {
    id: 1,
    author: { username: dummyUser.username, avatarUrl: dummyUser.avatarUrl },
    timeAgo: "2 hours ago",
    content: "Just finished setting up my new Next.js project. Tailwind + Shadcn UI makes it so incredibly fast to build beautiful interfaces! 🚀✨",
    likes: 42,
    comments: 5
  }

  return (
    <div className="pb-20 md:pb-0 overflow-x-hidden">
      {/* Cover Photo */}
      <div className="h-40 md:h-52 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 w-full object-cover"></div>
      
      <div className="px-4 sm:px-6 bg-background border-b pb-6">
        <div className="relative flex justify-between items-end -mt-16 mb-4">
          <Avatar className="h-32 w-32 border-4 border-background bg-muted shadow-sm">
            <AvatarImage src={dummyUser.avatarUrl} className="object-cover" />
            <AvatarFallback className="text-4xl">{dummyUser.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <Mail className="h-4 w-4" />
            </Button>
            <Button className="rounded-full px-6 font-bold h-10">Edit Profile</Button>
          </div>
        </div>
        
        <div className="mt-2 text-start">
          <h1 className="text-2xl font-extrabold">{dummyUser.name}</h1>
          <p className="text-muted-foreground text-lg">@{dummyUser.username}</p>
        </div>
        
        <p className="mt-4 text-[15px] whitespace-pre-wrap">{dummyUser.bio}</p>
        
        <div className="flex flex-wrap gap-y-2 gap-x-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {dummyUser.location}</span>
          <span className="flex items-center gap-1.5"><LinkIcon className="h-4 w-4" /> <a href="#" className="text-blue-500 hover:underline">{dummyUser.website}</a></span>
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Joined {dummyUser.joined}</span>
        </div>
        
        <div className="flex gap-4 mt-5 text-[15px]">
          <p className="hover:underline cursor-pointer"><span className="font-bold text-foreground">{dummyUser.following}</span> <span className="text-muted-foreground">Following</span></p>
          <p className="hover:underline cursor-pointer"><span className="font-bold text-foreground">{dummyUser.followers}</span> <span className="text-muted-foreground">Followers</span></p>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="flex bg-background border-b overflow-x-auto no-scrollbar">
          <Button variant="ghost" className="rounded-none border-b-[3px] border-primary h-14 min-w-[100px] flex-1 font-bold text-[15px]">Posts</Button>
          <Button variant="ghost" className="rounded-none border-b-[3px] border-transparent text-muted-foreground hover:bg-muted/50 h-14 min-w-[100px] flex-1 font-medium text-[15px]">Replies</Button>
          <Button variant="ghost" className="rounded-none border-b-[3px] border-transparent text-muted-foreground hover:bg-muted/50 h-14 min-w-[100px] flex-1 font-medium text-[15px]">Media</Button>
          <Button variant="ghost" className="rounded-none border-b-[3px] border-transparent text-muted-foreground hover:bg-muted/50 h-14 min-w-[100px] flex-1 font-medium text-[15px]">Likes</Button>
        </div>
        
        <div className="py-4 sm:px-4 max-w-xl mx-auto">
          <PostCard post={dummyPost} />
          <PostCard post={{...dummyPost, id: 2, content: "Another day, another line of code. Consistency is the key to mastering anything.", likes: 112, comments: 16, timeAgo: "1 day ago"}} />
          <PostCard post={{...dummyPost, id: 3, content: "Look at this amazing sunset!", imageUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2000&auto=format&fit=crop", likes: 300, comments: 24, timeAgo: "3 days ago"}} />
        </div>
      </div>
    </div>
  )
}

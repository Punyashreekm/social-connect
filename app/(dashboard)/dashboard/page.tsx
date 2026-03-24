import CreatePost from '@/components/post/CreatePost'
import PostCard from '@/components/post/PostCard'

export default function DashboardFeed() {
  const dummyPosts = [
    {
      id: 1,
      author: { username: "alex_dev", avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop" },
      timeAgo: "2 hours ago",
      content: "Just finished setting up my new Next.js project. Tailwind + Shadcn UI makes it so incredibly fast to build beautiful interfaces! 🚀✨\n\nWhat are you all building this weekend?",
      likes: 42,
      comments: 5
    },
    {
      id: 2,
      author: { username: "sarah_designer", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" },
      timeAgo: "5 hours ago",
      content: "Exploring some new color palettes for my upcoming portfolio redesign. Dark mode is definitely a must in 2026. What do you all think of this vibe? 🎨",
      imageUrl: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2000&auto=format&fit=crop",
      likes: 128,
      comments: 14
    },
    {
      id: 3,
      author: { username: "tech_insider", avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=150&auto=format&fit=crop" },
      timeAgo: "1 day ago",
      content: "BREAKING: The new AI models can now write entire applications from scratch in seconds. The future is crazy.",
      likes: 89,
      comments: 23
    }
  ]

  return (
    <div className="py-4 sm:px-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold px-4 sm:px-0 mb-4 md:hidden">Home</h1>
      <CreatePost />
      <div className="mt-4">
        {dummyPosts.map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  )
}

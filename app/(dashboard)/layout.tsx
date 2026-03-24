import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import { Home, User, Bell, MessageSquare } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20 pb-16 md:pb-0 pt-16">
      <Navbar />
      <div className="flex max-w-6xl mx-auto md:px-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r h-[calc(100vh-4rem)] sticky top-16 bg-background">
          <Sidebar />
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 max-w-2xl mx-auto w-full border-x min-h-[calc(100vh-4rem)] bg-background sm:bg-transparent sm:border-x-0">
          {children}
        </main>
        
        {/* Right Sidebar (Optional for later - trending, suggestions) */}
        <aside className="hidden lg:flex w-80 flex-col p-4 h-[calc(100vh-4rem)] sticky top-16 rounded-xl mt-4 ml-6">
          <div className="bg-background rounded-xl border p-4">
            <h2 className="font-bold mb-4 text-lg">Who to follow</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Suggestions will appear here...</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background z-50 flex items-center justify-around md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Link href="/dashboard" className="p-3 text-muted-foreground hover:text-primary transition-colors hover:bg-muted rounded-full"><Home className="h-6 w-6" /></Link>
        <Link href="/dashboard" className="p-3 text-muted-foreground hover:text-primary transition-colors hover:bg-muted rounded-full"><MessageSquare className="h-6 w-6" /></Link>
        <Link href="/dashboard" className="p-3 text-muted-foreground hover:text-primary transition-colors hover:bg-muted rounded-full"><Bell className="h-6 w-6" /></Link>
        <Link href="/profile" className="p-3 text-muted-foreground hover:text-primary transition-colors hover:bg-muted rounded-full"><User className="h-6 w-6" /></Link>
      </nav>
    </div>
  )
}

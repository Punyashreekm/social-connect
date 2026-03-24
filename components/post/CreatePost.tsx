import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ImageIcon, Link2 } from 'lucide-react'

export default function CreatePost() {
  return (
    <Card className="p-4 rounded-none sm:rounded-xl border-x-0 sm:border mb-4 shadow-sm bg-background">
      <div className="flex gap-4">
        <Avatar className="mt-1 w-10 h-10">
          <AvatarFallback>Me</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea 
            placeholder="What's happening?" 
            className="min-h-[60px] text-lg resize-none border-0 focus-visible:ring-0 px-0 shadow-none bg-transparent"
          />
          <div className="flex flex-wrap items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-blue-500 rounded-full hover:bg-blue-50 h-9 w-9">
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-blue-500 rounded-full hover:bg-blue-50 h-9 w-9">
                <Link2 className="h-5 w-5" />
              </Button>
            </div>
            <Button className="rounded-full px-6 font-bold" disabled>Post</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

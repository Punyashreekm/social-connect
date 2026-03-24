import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Welcome to Social App</h1>
        <p className="text-muted-foreground">Sign in to continue</p>
        <div className="flex gap-4 justify-center mt-6">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Register</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link";
import { Home, User, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const routes = [
    { label: "Home", icon: Home, href: "/dashboard" },
    { label: "Profile", icon: User, href: "/profile" },
  ];

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex-1 space-y-2">
        {routes.map((route) => (
          <Button
            key={route.href}
            variant="ghost"
            className="w-full justify-start gap-4 text-lg"
            asChild
          >
            <Link href={route.href}>
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          </Button>
        ))}
        <Button className="w-full rounded-full mt-6 h-12 text-lg" size="lg" asChild>
          <Link href="/create-post">Create  Post</Link>
        </Button>
      </div>
    </div>
  );
}

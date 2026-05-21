import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export async function TopBar({ title }: { title: string }) {
  const session = await auth();
  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto p-1.5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-slate-700 max-w-32 truncate">
                {user?.name ?? user?.email ?? "Account"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/auth/signin" });
                }}
              >
                <button className="flex items-center gap-2 w-full" type="submit">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

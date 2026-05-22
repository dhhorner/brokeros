import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";

export async function TopBar({ title }: { title: string }) {
  const session = await auth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-500" />
        </Button>

        <UserMenu user={session?.user} />
      </div>
    </header>
  );
}

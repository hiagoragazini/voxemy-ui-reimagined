import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Home, User, Settings, Plus, Phone } from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavigationItemProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

function NavigationItem({ to, icon: Icon, children }: NavigationItemProps) {
  return (
    <NavigationMenuItem>
      <Link href={to} legacyBehavior passHref>
        <Link
          className="group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 text-sm font-medium transition-colors hover:bg-secondary focus:bg-secondary focus:text-primary"
          href={to}
        >
          <Icon className="mr-2 h-4 w-4" />
          {children}
        </Link>
      </Link>
    </NavigationMenuItem>
  );
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { user } = useUser();
  const router = useRouter();

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 px-2 text-base hover:bg-secondary md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 border-r p-0">
          <SheetHeader className="text-left px-4 py-3">
            <SheetTitle>Voxemy</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1">
            <NavigationItem to="/" icon={Home}>
              Home
            </NavigationItem>

            <h3 className="px-2 text-xs font-semibold text-muted-foreground">
              Administração
            </h3>

            <NavigationItem to="/agents" icon={User}>
              Agentes
            </NavigationItem>

            <NavigationItem to="/campaigns" icon={Settings}>
              Campanhas
            </NavigationItem>

            <NavigationItem to="/leads" icon={Plus}>
              Leads
            </NavigationItem>

            <h3 className="px-2 text-xs font-semibold text-muted-foreground">
              Ferramentas
            </h3>
            
            <NavigationItem to="/twilio-test" icon={Phone}>
              Teste Twilio
            </NavigationItem>
            
            <NavigationItem to="/zenvia-test" icon={Phone}>
              Teste Zenvia
            </NavigationItem>
            
            <NavigationItem to="/voicebot-test" icon={Phone}>
              Voicebot Full-Duplex
            </NavigationItem>
          </nav>

          <div className="mt-6 px-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex h-8 w-full items-center justify-between rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">{user?.firstName} {user?.lastName}</span>
                      <span className="text-xs text-muted-foreground">{user?.emailAddresses[0].emailAddress}</span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" forceMount>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  Editar perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/sign-out")}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetContent>
      </Sheet>

      <aside className="hidden border-r md:block">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Voxemy
            </h2>
          </div>

          <nav className="flex flex-col gap-1">
            <NavigationItem to="/" icon={Home}>
              Home
            </NavigationItem>

            <h3 className="px-2 text-xs font-semibold text-muted-foreground">
              Administração
            </h3>

            <NavigationItem to="/agents" icon={User}>
              Agentes
            </NavigationItem>

            <NavigationItem to="/campaigns" icon={Settings}>
              Campanhas
            </NavigationItem>

            <NavigationItem to="/leads" icon={Plus}>
              Leads
            </NavigationItem>

            <h3 className="px-2 text-xs font-semibold text-muted-foreground">
              Ferramentas
            </h3>
            
            <NavigationItem to="/twilio-test" icon={Phone}>
              Teste Twilio
            </NavigationItem>
            
            <NavigationItem to="/zenvia-test" icon={Phone}>
              Teste Zenvia
            </NavigationItem>
            
            <NavigationItem to="/voicebot-test" icon={Phone}>
              Voicebot Full-Duplex
            </NavigationItem>
          </nav>
        </div>
      </aside>
    </>
  );
}

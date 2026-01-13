"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings, LayoutDashboard, Shield } from "lucide-react";

export function UserNav({ isMobileMenu = false }: { isMobileMenu?: boolean }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (mounted) setRole(profile?.role || "user");
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          if (mounted) setRole(profile?.role || "user");
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          router.refresh();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    if (isMobileMenu) {
      return (
        <div className="flex flex-col gap-3 w-full">
          <Button asChild variant="outline" className="w-full font-bold h-12 text-lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="w-full font-bold h-12 text-lg">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 md:gap-4">
        <Button asChild variant="ghost" className="hidden lg:inline-flex font-semibold">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild className="hidden lg:inline-flex font-semibold px-6">
          <Link href="/register">Sign Up</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex lg:hidden font-semibold px-6">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (isMobileMenu) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 font-bold"
        >
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm">{user.user_metadata?.full_name || user.email}</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </Link>
        <Button 
          variant="destructive" 
          className="w-full font-bold h-12 text-lg"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Log out
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{user.user_metadata?.full_name || user.email}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer flex items-center py-2">
              <LayoutDashboard className="mr-3 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Dashboard</span>
            </Link>
          </DropdownMenuItem>
          {role === "admin" && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer flex items-center py-2 text-primary focus:text-primary focus:bg-primary/5">
                <Shield className="mr-3 h-4 w-4" />
                <span className="font-bold">Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer flex items-center py-2">
            <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
          }} 
          className="cursor-pointer flex items-center py-2 text-destructive focus:text-destructive focus:bg-destructive/5"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

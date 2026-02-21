import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Briefcase,
  HomeIcon,
  MessagesSquare,
  SearchIcon,
  UsersIcon,
  Flame,
  GraduationCap,
  Settings,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { HxLogo } from "./HxLogo";

async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-14 max-w-7xl mx-auto px-4 lg:px-6">
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <HxLogo className="h-9 w-9" />
            <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400 hidden sm:block group-hover:opacity-80 transition-opacity">
              Hx
            </span>
          </Link>

          {/* Minimal Search - visible on larger screens */}
          <div className="hidden md:flex items-center relative w-64 group">
            <SearchIcon className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-1.5 bg-secondary/50 border border-transparent 
                       hover:bg-secondary/80 focus:bg-background focus:border-primary/20 
                       rounded-lg text-sm transition-all duration-200 outline-none"
            />
          </div>
        </div>

        {/* Center: Navigation - streamlined */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/" icon={<HomeIcon className="h-[1.2rem] w-[1.2rem]" />} active />
          <NavLink href="/network" icon={<UsersIcon className="h-[1.2rem] w-[1.2rem]" />} />
          <NavLink href="/jobs" icon={<Briefcase className="h-[1.2rem] w-[1.2rem]" />} />
          <NavLink href="/swipe" icon={<Flame className="h-[1.2rem] w-[1.2rem]" />} badge="New" />
          <NavLink href="/messages" icon={<MessagesSquare className="h-[1.2rem] w-[1.2rem]" />} />
          
          {/* Collapsible/More Menu for mobile/tablet could go here */}
          <div className="hidden lg:flex items-center gap-1">
             <NavLink href="/mentorship" icon={<GraduationCap className="h-[1.2rem] w-[1.2rem]" />} />
             <NavLink href="/analytics" icon={<BarChart3 className="h-[1.2rem] w-[1.2rem]" />} />
          </div>
        </nav>

        {/* Right: User Actions */}
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            <Settings className="h-5 w-5" />
          </Link>

          <div className="pl-2 border-l border-white/10">
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 ring-2 ring-white/10 hover:ring-primary/40 transition-all"
                  }
                }}
              />
            </SignedIn>
            <SignedOut>
              <Button asChild variant="ghost" size="sm" className="text-sm font-medium">
                <SignInButton />
              </Button>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}

// Minimal NavLink Component
interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  active?: boolean; // For demonstration, ideally determined by current path
  badge?: string;
  className?: string;
}

function NavLink({ href, icon, badge, className = "" }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      className={`relative flex items-center justify-center p-2.5 rounded-xl
                 text-muted-foreground hover:text-foreground hover:bg-white/5 
                 transition-all duration-200 group ${className}`}
    >
      {icon}
      {badge && (
        <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-background animate-pulse" />
      )}
      {/* Hover tooltip effect could go here */}
    </Link>
  );
}

export default Header;

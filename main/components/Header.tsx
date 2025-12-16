import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Briefcase,
  HomeIcon,
  MessagesSquare,
  SearchIcon,
  UsersIcon,
  Zap,
  Trophy,
  GraduationCap,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

async function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 max-w-7xl mx-auto px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="bg-gradient-to-br from-primary to-accent rounded-xl p-2">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text hidden sm:block">
            HEXjuy's
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <form className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search posts, teams, or people..."
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-full 
                       focus:ring-2 focus:ring-primary focus:border-transparent 
                       transition-all duration-200 outline-none text-sm"
            />
          </form>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-1">
          <NavLink href="/" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
          <NavLink 
            href="/network" 
            icon={<UsersIcon className="h-5 w-5" />} 
            label="Network" 
            className="hidden md:flex"
          />
          <NavLink 
            href="/teams" 
            icon={<Trophy className="h-5 w-5" />} 
            label="Teams" 
            badge="New"
          />
          <NavLink 
            href="/jobs" 
            icon={<Briefcase className="h-5 w-5" />} 
            label="Jobs" 
            className="hidden lg:flex"
          />
          <NavLink 
            href="/messages" 
            icon={<MessagesSquare className="h-5 w-5" />} 
            label="Messages"
            className="hidden md:flex"
          />
          <NavLink 
            href="/mentorship" 
            icon={<GraduationCap className="h-5 w-5" />} 
            label="Mentor" 
            className="hidden lg:flex"
          />
          <NavLink 
            href="/settings" 
            icon={<Settings className="h-5 w-5" />} 
            label="Settings"
            className="hidden lg:flex"
          />

          {/* User Section */}
          <div className="ml-4 flex items-center space-x-2">
            <SignedIn>
              <div className="relative">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
                    }
                  }}
                />
              </div>
            </SignedIn>
            <SignedOut>
              <Button className="btn-primary">
                <SignInButton />
              </Button>
            </SignedOut>
          </div>
        </nav>
      </div>
    </header>
  );
}

// NavLink Component
interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  className?: string;
}

function NavLink({ href, icon, label, badge, className = "" }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg
                 hover:bg-secondary transition-all duration-200 group relative ${className}`}
    >
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] 
                         font-bold px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs mt-1 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </Link>
  );
}

export default Header;

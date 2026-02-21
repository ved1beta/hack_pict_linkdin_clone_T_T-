import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
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
  FolderGit2,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import connectDB from "@/mongodb/db";
import { User } from "@/mongodb/models/user";

async function Header() {
  const clerkUser = await currentUser();
  let userType: "student" | "recruiter" | null = null;

  if (clerkUser) {
    await connectDB();
    const dbUser = await User.findOne({ userId: clerkUser.id }).lean();
    userType = dbUser?.userType || null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-14 max-w-7xl mx-auto px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-1.5">
            <Link2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:block tracking-tight">
            HEX<span className="text-primary">Link</span>
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <form className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-1.5 bg-secondary/50 border border-border/50 rounded-full 
                       focus:ring-2 focus:ring-primary/30 focus:border-primary/50 
                       transition-all duration-200 outline-none text-sm"
            />
          </form>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-0.5">
          <NavLink href="/" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
          <NavLink 
            href="/network" 
            icon={<UsersIcon className="h-5 w-5" />} 
            label="Network" 
            className="hidden md:flex"
          />
          <NavLink 
            href="/jobs" 
            icon={<Briefcase className="h-5 w-5" />} 
            label="Jobs" 
            className="hidden lg:flex"
          />
          
          {/* Student-only features */}
          {userType === "student" && (
            <>
              <NavLink 
                href="/swipe" 
                icon={<Flame className="h-5 w-5" />} 
                label="Swipe" 
                badge="Hot"
              />
              <NavLink 
                href="/mentorship" 
                icon={<GraduationCap className="h-5 w-5" />} 
                label="Mentor" 
                className="hidden lg:flex"
              />
              <NavLink 
                href="/projects" 
                icon={<FolderGit2 className="h-5 w-5" />} 
                label="Projects" 
                className="hidden md:flex"
              />
              <NavLink 
                href="/analytics" 
                icon={<BarChart3 className="h-5 w-5" />} 
                label="Insights"
                className="hidden md:flex"
              />
            </>
          )}

          {/* Recruiter-only features */}
          {userType === "recruiter" && (
            <>
              <NavLink 
                href="/recruiter" 
                icon={<BarChart3 className="h-5 w-5" />} 
                label="Dashboard" 
                className="hidden md:flex"
              />
              <NavLink 
                href="/recruiter/post-job" 
                icon={<Briefcase className="h-5 w-5" />} 
                label="Post Job" 
                className="hidden lg:flex"
              />
            </>
          )}

          <NavLink 
            href="/messages" 
            icon={<MessagesSquare className="h-5 w-5" />} 
            label="Chat"
            className="hidden md:flex"
          />
          <NavLink 
            href="/settings" 
            icon={<Settings className="h-5 w-5" />} 
            label="Settings"
            className="hidden lg:flex"
          />

          {/* User Section */}
          <div className="ml-3 flex items-center space-x-2">
            <SignedIn>
              <div className="relative">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 rounded-full ring-2 ring-primary/10 hover:ring-primary/30 transition-all"
                    }
                  }}
                />
              </div>
            </SignedIn>
            <SignedOut>
              <Button className="btn-primary text-sm h-8 px-4">
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
      className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg
                 hover:bg-secondary/80 transition-all duration-200 group relative ${className}`}
    >
      <div className="relative text-muted-foreground group-hover:text-foreground transition-colors">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1.5 bg-accent text-white text-[9px] 
                         font-bold px-1 py-0 rounded-full leading-tight">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-0.5 font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </Link>
  );
}

export default Header;

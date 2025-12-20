import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  User,
  FileText,
  BookOpen,
  Calendar,
  Folder,
  Briefcase,
  Trophy,
  Settings,
  CheckSquare,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  isMobile?: boolean;
}

const DashboardSidebar = ({ isMobile = false }: DashboardSidebarProps) => {
  const { profile, isOrganizer, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const mainNavItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "My Profile", icon: User, href: "/profile" },
    { label: "My Events", icon: Calendar, href: "/my-events" },
    { label: "My Projects", icon: Folder, href: "/projects" },
    { label: "Task Plaza", icon: Briefcase, href: "/tasks" },
  ];

  const contributeItems = [
    { label: "Materials", icon: FileText, href: "/upload-material" },
    { label: "Books", icon: BookOpen, href: "/sell-book" },
  ];

  const organizerItems = isOrganizer || isAdmin
    ? [{ label: "Organizer Dashboard", icon: CheckSquare, href: "/organizer/dashboard" }]
    : [];

  const isActive = (href: string) => location.pathname === href;

  return (
    <aside className={cn(
      "flex flex-col bg-card border-r border-border min-h-screen p-4",
      isMobile ? "w-full" : "hidden lg:flex w-64"
    )}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 px-3 py-4 mb-6">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">U</span>
        </div>
        <span className="font-bold text-xl text-foreground">UniVoid</span>
      </Link>

      {/* User Card */}
      <div className="bg-secondary/50 rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          {profile?.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt={profile.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.degree} • Year {profile?.current_year}
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Main
        </p>
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}

        {/* Contribute Section */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">
          Contribute
        </p>
        {contributeItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}

        {/* Organizer Section */}
        {organizerItems.length > 0 && (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">
              Organizer
            </p>
            {organizerItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </>
        )}

        {/* Leaderboard */}
        <Link
          to="/leaderboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-4",
            isActive("/leaderboard")
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-secondary"
          )}
        >
          <Trophy className="w-4 h-4" />
          Leaderboard
        </Link>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-border pt-4 mt-4 space-y-1">
        <Link
          to="/profile/edit"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;

import { useLocation } from "react-router-dom";
import { PrefetchLink } from "@/components/common/PrefetchLink";
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
  LogOut,
  Shield,
  Newspaper,
  Repeat2,
  Ticket,
  Plus,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  isMobile?: boolean;
}

const DashboardSidebar = ({ isMobile = false }: DashboardSidebarProps) => {
  const { profile, isOrganizer, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Dashboard-specific items
  const dashboardItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "My Profile", icon: User, href: "/profile" },
    { label: "My Tickets", icon: Ticket, href: "/my-events" },
  ];

  // Browse Items
  const browseItems = [
    { label: "Materials", icon: BookOpen, href: "/materials" },
    { label: "Events", icon: Calendar, href: "/events" },
    { label: "Projects", icon: Folder, href: "/projects" },
    { label: "Task Plaza", icon: Briefcase, href: "/tasks" },
    { label: "Books", icon: Repeat2, href: "/books" },
    { label: "Campus News", icon: Newspaper, href: "/news" },
    { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  ];

  // Contribute Items
  const contributeItems = [
    { label: "Upload Material", icon: FileText, href: "/upload-material" },
    { label: "Sell Book", icon: Repeat2, href: "/sell-book" },
    { label: "Create Project", icon: Folder, href: "/projects/create" },
    { label: "Post Task", icon: Briefcase, href: "/tasks/create" },
  ];

  const renderNavItem = (item: { label: string; icon: React.ElementType; href: string }) => {
    return (
      <PrefetchLink
        key={item.href}
        to={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
          isActive(item.href)
            ? "bg-secondary border-border font-bold"
            : "text-foreground border-transparent hover:bg-secondary/50"
        )}
      >
        <item.icon className="w-4 h-4 stroke-[2px]" />
        {item.label}
      </PrefetchLink>
    );
  };

  return (
    <aside className={cn(
      "flex flex-col bg-card border-r border-border",
      isMobile 
        ? "w-full h-full overflow-y-auto" 
        : "hidden lg:flex w-64 h-screen sticky top-0 overflow-y-auto"
    )}>
      <div className="p-4 flex flex-col flex-1">
        {/* Logo - Always routes to HOME */}
        <PrefetchLink to="/" className="flex items-center gap-2 px-3 py-4 mb-4">
          <div className="w-10 h-10 bg-primary border border-border rounded-xl flex items-center justify-center shadow-sketch-sm">
            <span className="text-primary-foreground font-bold text-lg">U</span>
          </div>
          <span className="font-bold text-xl text-foreground">UniVoid</span>
        </PrefetchLink>

        {/* User Card */}
        <PrefetchLink to="/profile" className="bg-card border border-border rounded-xl p-4 mb-6 shadow-sketch-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-sketch transition-all">
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
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-semibold">{profile?.total_xp || 0} XP</span>
              </div>
            </div>
          </div>
        </PrefetchLink>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {/* Home Link */}
          <PrefetchLink
            to="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
              isActive("/")
                ? "bg-secondary border-border font-bold"
                : "text-foreground border-transparent hover:bg-secondary/50"
            )}
          >
            <Home className="w-4 h-4 stroke-[2px]" />
            Home
          </PrefetchLink>

          {/* My Stuff Section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-2">
            My Stuff
          </p>
          {dashboardItems.map(renderNavItem)}

          {/* Browse Section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">
            Browse
          </p>
          {browseItems.map(renderNavItem)}

          {/* Contribute Section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2 flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Contribute
          </p>
          {contributeItems.map(renderNavItem)}

          {/* Organizer Section */}
          {(isOrganizer || isAdmin) && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">
                Organizer
              </p>
              <PrefetchLink
                to="/organizer/dashboard"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                  isActive("/organizer/dashboard")
                    ? "bg-secondary border-border font-bold"
                    : "text-foreground border-transparent hover:bg-secondary/50"
                )}
              >
                <Calendar className="w-4 h-4 stroke-[2px]" />
                Organizer Panel
              </PrefetchLink>
            </>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">
                Admin
              </p>
              <PrefetchLink
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border",
                  isActive("/admin")
                    ? "bg-secondary border-border font-bold"
                    : "text-foreground border-transparent hover:bg-secondary/50"
                )}
              >
                <Shield className="w-4 h-4 stroke-[2px]" />
                Admin Panel
              </PrefetchLink>
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border pt-4 mt-4 space-y-1">
          <PrefetchLink
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive("/settings")
                ? "bg-secondary font-bold"
                : "text-foreground hover:bg-secondary/50"
            )}
          >
            <Settings className="w-4 h-4 stroke-[2px]" />
            Settings
          </PrefetchLink>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 stroke-[2px]" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;

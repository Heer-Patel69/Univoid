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
  LogOut,
  Shield,
  GraduationCap,
  Newspaper,
  Repeat2,
  Ticket,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  isMobile?: boolean;
}

const DashboardSidebar = ({ isMobile = false }: DashboardSidebarProps) => {
  const { profile, isOrganizer, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  // Core Browse Items - Always visible
  const browseItems = [
    { label: "Materials", icon: BookOpen, href: "/materials" },
    { label: "Scholarships", icon: GraduationCap, href: "/scholarships" },
    { label: "Events", icon: Calendar, href: "/events" },
    { label: "Projects", icon: Folder, href: "/projects" },
    { label: "Task Plaza", icon: Briefcase, href: "/tasks" },
    { label: "Books", icon: Repeat2, href: "/books" },
    { label: "Campus News", icon: Newspaper, href: "/news" },
    { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  ];

  // My Stuff - User's personal items
  const myItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "My Profile", icon: User, href: "/profile" },
    { label: "My Tickets", icon: Ticket, href: "/my-events" },
  ];

  // Contribute Items
  const contributeItems = [
    { label: "Upload Material", icon: FileText, href: "/upload-material" },
    { label: "Sell Book", icon: Repeat2, href: "/sell-book" },
    { label: "Create Project", icon: Folder, href: "/projects/create" },
    { label: "Post Task", icon: Briefcase, href: "/tasks/create" },
  ];

  return (
    <aside className={cn(
      "flex flex-col bg-card border-r border-border",
      isMobile 
        ? "w-full h-full overflow-y-auto" 
        : "hidden lg:flex w-64 h-screen sticky top-0 overflow-y-auto"
    )}>
      <div className="p-4 flex flex-col flex-1">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 px-3 py-4 mb-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">U</span>
          </div>
          <span className="font-bold text-xl text-foreground">UniVoid</span>
        </Link>

        {/* User Card */}
        <Link to="/profile" className="bg-secondary/50 rounded-2xl p-4 mb-6 hover:bg-secondary transition-colors">
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
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {/* My Stuff Section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            My Stuff
          </p>
          {myItems.map((item) => (
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

          {/* Browse Section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">
            Browse
          </p>
          {browseItems.map((item) => (
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
            <Plus className="w-3 h-3 inline mr-1" />
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
          {(isOrganizer || isAdmin) && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">
                Organizer
              </p>
              <Link
                to="/organizer/dashboard"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive("/organizer/dashboard")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Calendar className="w-4 h-4" />
                Organizer Panel
              </Link>
            </>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-6 mb-2">
                Admin
              </p>
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive("/admin")
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border pt-4 mt-4 space-y-1">
          <Link
            to="/settings"
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
      </div>
    </aside>
  );
};

export default DashboardSidebar;

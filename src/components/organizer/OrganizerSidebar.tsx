import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Calendar, 
  ScanLine, 
  Users, 
  BarChart3, 
  Settings,
  ChevronLeft,
  FileSpreadsheet,
  Shield,
  LogOut,
  Home
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface OrganizerSidebarProps {
  selectedEventId?: string | null;
  eventTitle?: string;
}

const mainNavItems = [
  { href: "/organizer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/organizer/events", label: "My Events", icon: Calendar },
];

const eventNavItems = [
  { section: "registrations", label: "Registrations", icon: Users },
  { section: "analytics", label: "Analytics", icon: BarChart3 },
  { section: "volunteers", label: "Volunteers", icon: Users },
  { section: "clubs", label: "Club Members", icon: Shield },
  { section: "sheets", label: "Export", icon: FileSpreadsheet },
];

export function OrganizerSidebar({ selectedEventId, eventTitle }: OrganizerSidebarProps) {
  const location = useLocation();
  const { user, profile } = useAuth();

  const isActive = (href: string, exact = false) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">U</span>
          </div>
          <span className="font-display font-bold text-lg">UniVoid</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Organizer Console</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground px-3 py-2">Navigation</p>
        {mainNavItems.map((item) => (
          <PrefetchLink
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </PrefetchLink>
        ))}

        {/* Quick Scan Button */}
        {selectedEventId && (
          <PrefetchLink
            to={`/organizer/check-in/${selectedEventId}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            Quick Scan
          </PrefetchLink>
        )}

        <Separator className="my-3" />

        {/* Event-specific navigation */}
        {selectedEventId && eventTitle && (
          <>
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Current Event</p>
              <p className="text-sm font-semibold truncate mt-0.5">{eventTitle}</p>
            </div>
            
            <div className="space-y-0.5">
              {eventNavItems.map((item) => (
                <button
                  key={item.section}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                    "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => {
                    // Scroll to tab section
                    const tabTrigger = document.querySelector(`[value="${item.section}"]`) as HTMLElement;
                    if (tabTrigger) {
                      tabTrigger.click();
                      tabTrigger.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <PrefetchLink
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Home className="w-4 h-4" />
          User Dashboard
        </PrefetchLink>
        
        <PrefetchLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </PrefetchLink>

        <Separator className="my-2" />

        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profile_photo_url || undefined} />
            <AvatarFallback className="text-xs">
              {profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || "Organizer"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

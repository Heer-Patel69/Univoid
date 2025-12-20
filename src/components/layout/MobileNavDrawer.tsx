import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Menu,
  User,
  LogOut,
  Shield,
  BookOpen,
  Repeat2,
  Trophy,
  Calendar,
  LayoutDashboard,
  Folder,
  Briefcase,
  ChevronDown,
  Settings,
  GraduationCap,
  Newspaper,
  Ticket,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

interface MobileNavDrawerProps {
  onAuthClick: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  organizerOnly?: boolean;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
  showOnlyWhenHasItems?: boolean;
}

export const MobileNavDrawer = ({ onAuthClick }: MobileNavDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    browse: true,
    account: false,
  });
  const { user, profile, isAdmin, isOrganizer, signOut } = useAuth();
  const location = useLocation();

  // Swipe gesture handling
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const deltaX = touchStartX.current - touchCurrentX.current;
    if (deltaX > SWIPE_THRESHOLD) {
      setOpen(false);
    }
    touchStartX.current = 0;
    touchCurrentX.current = 0;
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActiveLink = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const navSections: NavSection[] = [
    {
      title: "Browse",
      icon: BookOpen,
      defaultOpen: true,
      items: [
        { href: "/materials", label: "Materials", icon: BookOpen },
        { href: "/scholarships", label: "Scholarships", icon: GraduationCap },
        { href: "/events", label: "Events", icon: Calendar },
        { href: "/projects", label: "Projects", icon: Folder },
        { href: "/tasks", label: "Task Plaza", icon: Briefcase },
        { href: "/books", label: "Books", icon: Repeat2 },
        { href: "/news", label: "Campus News", icon: Newspaper },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
      ],
    },
    {
      title: "My Account",
      icon: User,
      showOnlyWhenHasItems: true,
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true },
        { href: "/my-events", label: "My Tickets", icon: Ticket, requiresAuth: true },
        { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true },
      ],
    },
    {
      title: "Organizer",
      icon: Calendar,
      showOnlyWhenHasItems: true,
      items: [
        { href: "/organizer/dashboard", label: "Organizer Panel", icon: LayoutDashboard, organizerOnly: true },
        { href: "/organizer/create-event", label: "Create Event", icon: Calendar, organizerOnly: true },
      ],
    },
    {
      title: "Admin",
      icon: Shield,
      showOnlyWhenHasItems: true,
      items: [
        { href: "/admin", label: "Admin Panel", icon: Shield, adminOnly: true },
      ],
    },
  ];

  // Filter items based on auth and roles
  const getFilteredItems = (section: NavSection) => {
    return section.items.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.organizerOnly && !(isOrganizer || isAdmin)) return false;
      if (item.requiresAuth && !user) return false;
      return true;
    });
  };

  // Only show sections that have visible items
  const visibleSections = navSections.filter(section => {
    const items = getFilteredItems(section);
    if (section.showOnlyWhenHasItems && items.length === 0) return false;
    return items.length > 0;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden p-2.5 hover:bg-secondary rounded-2xl transition-all border border-border-strong/10 shadow-soft"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" strokeWidth={2.5} />
        </button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[300px] p-0 flex flex-col bg-background border-r border-border"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2.5 group"
              onClick={() => setOpen(false)}
            >
              <div className="w-10 h-10 bg-foreground rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-soft">
                <span className="text-background font-extrabold text-lg font-display">U</span>
              </div>
              <SheetTitle className="font-extrabold text-xl text-foreground font-display">UniVoid</SheetTitle>
            </Link>
            <ThemeToggle className="rounded-full" />
          </div>
        </SheetHeader>

        {/* User Profile Section */}
        {user && profile && (
          <div className="p-4 border-b border-border bg-secondary/30">
            <Link 
              to="/profile" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-12 w-12 border-2 border-border-strong/20 shadow-soft">
                <AvatarImage src={profile.profile_photo_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="bg-pastel-purple text-foreground font-bold">
                  {profile.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">{profile.total_xp || 0} XP</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-2">
          {visibleSections.map((section) => {
            const filteredItems = getFilteredItems(section);
            const SectionIcon = section.icon;
            const sectionKey = section.title.toLowerCase().replace(/\s+/g, '');
            const isExpanded = expandedSections[sectionKey] ?? section.defaultOpen;

            return (
              <Collapsible
                key={section.title}
                open={isExpanded}
                onOpenChange={() => toggleSection(sectionKey)}
                className="border-b border-border/50 last:border-b-0"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {section.title}
                    </span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )} 
                    strokeWidth={2.5}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="animate-accordion-down">
                  <div className="pb-2">
                    {filteredItems.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = isActiveLink(item.href);

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-soft"
                              : "text-foreground hover:bg-secondary active:scale-[0.98]"
                          )}
                        >
                          <ItemIcon className="w-4 h-4" strokeWidth={2.5} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-secondary/30">
          {user ? (
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-11 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" strokeWidth={2.5} />
              Sign out
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full h-11 rounded-xl"
                onClick={() => { onAuthClick(); setOpen(false); }}
              >
                Sign in
              </Button>
              <Button 
                className="w-full h-11 rounded-xl shadow-soft"
                onClick={() => { onAuthClick(); setOpen(false); }}
              >
                Join UniVoid
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

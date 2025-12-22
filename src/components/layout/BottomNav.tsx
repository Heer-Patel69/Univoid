import { useLocation } from "react-router-dom";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import { BookOpen, Calendar, Repeat2, Briefcase, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Action-focused bottom nav items - no Home, no Profile, no Dashboard
const navItems = [
  { href: "/materials", label: "Materials", icon: BookOpen },
  { href: "/projects", label: "Project Partner", icon: Users, highlight: true },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/books", label: "Sell Books", icon: Repeat2 },
  { href: "/tasks", label: "Tasks", icon: Briefcase },
];

// Paths where bottom nav should NOT appear
const HIDDEN_PATHS = [
  "/admin",
  "/organizer",
  "/onboarding",
  "/dashboard",
];

export function BottomNav() {
  const location = useLocation();

  // Hide on admin, organizer, and dashboard pages
  const shouldHide = HIDDEN_PATHS.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) {
    return null;
  }

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border-strong/10 shadow-lg flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/" && location.pathname.startsWith(item.href));
          const Icon = item.icon;

          // Generate tour ID based on href
          const tourId = `mobile-nav-${item.href.replace('/', '')}`;
          
          return (
            <PrefetchLink
              key={item.href}
              id={tourId}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                    item.highlight && !isActive && "bg-pastel-purple",
                    item.highlight && isActive && "bg-foreground text-background shadow-md",
                    isActive && !item.highlight && "bg-foreground text-background shadow-md"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.5} />
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-all",
                isActive && "font-bold"
              )}>{item.label}</span>
            </PrefetchLink>
          );
        })}
      </div>
    </nav>
  );
}

import { Link, useLocation } from "react-router-dom";
import { BookOpen, Calendar, GraduationCap, LayoutDashboard, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useScholarshipBadge } from "@/hooks/useScholarshipBadge";
import { useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, requiresAuth: true },
  { href: "/materials", label: "Materials", icon: BookOpen },
  { href: "/scholarships", label: "Scholarships", icon: GraduationCap, highlight: true, showBadge: true },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User, requiresAuth: true },
];

// Paths where bottom nav should NOT appear
const HIDDEN_PATHS = [
  "/admin",
  "/organizer",
  "/onboarding",
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { hasNewScholarships, newCount, markAsSeen } = useScholarshipBadge();

  // Clear badge when on scholarships page
  useEffect(() => {
    if (location.pathname.startsWith("/scholarships") && hasNewScholarships) {
      markAsSeen();
    }
  }, [location.pathname, hasNewScholarships, markAsSeen]);

  // Hide on admin and organizer pages
  const shouldHide = HIDDEN_PATHS.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) {
    return null;
  }

  // Filter items based on auth
  const visibleItems = navItems.filter(item => {
    if (item.requiresAuth && !user) {
      if (item.href === "/dashboard") return false;
      if (item.href === "/profile") return false;
    }
    return true;
  });

  // Add home for non-auth users
  const finalItems = user ? visibleItems : [
    { href: "/", label: "Home", icon: Home },
    ...visibleItems.filter(i => i.href !== "/profile"),
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border-strong/10 shadow-lg flex items-center justify-around py-2 px-1">
        {finalItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/" && location.pathname.startsWith(item.href));
          const Icon = item.icon;
          const showBadge = 'showBadge' in item && item.showBadge && hasNewScholarships && !isActive;

          // Generate tour ID based on href
          const tourId = `mobile-nav-${item.href.replace('/', '')}`;
          
          return (
            <Link
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
                    'highlight' in item && item.highlight && !isActive && "bg-pastel-purple",
                    'highlight' in item && item.highlight && isActive && "bg-foreground text-background shadow-md",
                    isActive && !('highlight' in item && item.highlight) && "bg-foreground text-background shadow-md"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.5} />
                </div>
                {/* Badge indicator */}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {newCount > 9 ? "9+" : newCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-all",
                isActive && "font-bold"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

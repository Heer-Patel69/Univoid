import { Link, useLocation } from "react-router-dom";
import { BookOpen, Calendar, GraduationCap, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, requiresAuth: true },
  { href: "/materials", label: "Materials", icon: BookOpen },
  { href: "/scholarships", label: "Scholarships", icon: GraduationCap, highlight: true },
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

  // Hide on admin and organizer pages
  const shouldHide = HIDDEN_PATHS.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) {
    return null;
  }

  // Filter items based on auth
  const visibleItems = navItems.filter(item => {
    if (item.requiresAuth && !user) {
      // Replace Dashboard with "/" for non-auth users
      if (item.href === "/dashboard") return false;
      if (item.href === "/profile") return false;
    }
    return true;
  });

  // Add home for non-auth users
  const finalItems = user ? visibleItems : [
    { href: "/", label: "Home", icon: LayoutDashboard },
    ...visibleItems.filter(i => i.href !== "/profile"),
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border-strong/10 shadow-lg flex items-center justify-around py-2 px-1">
        {finalItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/" && location.pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground"
              )}
            >
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

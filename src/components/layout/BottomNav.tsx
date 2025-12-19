import { Link, useLocation } from "react-router-dom";
import { BookOpen, Newspaper, Trophy, PenLine, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/materials", label: "Materials", icon: BookOpen },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/leaderboard", label: "Ranks", icon: Trophy, highlight: true },
  { href: "/blogs", label: "Blogs", icon: PenLine },
  { href: "/books", label: "Books", icon: Repeat2 },
];

// Paths where bottom nav should NOT appear
const HIDDEN_PATHS = [
  "/dashboard",
  "/upload-material",
  "/submit-blog",
  "/submit-news",
  "/sell-book",
  "/admin",
  "/profile",
];

export function BottomNav() {
  const location = useLocation();

  // Hide on dashboard and protected action pages
  const shouldHide = HIDDEN_PATHS.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) {
    return null;
  }

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="bg-card/90 backdrop-blur-xl rounded-full border border-border-strong/10 shadow-soft-lg flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all",
                isActive 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  item.highlight && !isActive && "bg-pastel-purple",
                  item.highlight && isActive && "bg-foreground text-background scale-110 shadow-soft",
                  isActive && !item.highlight && "bg-foreground text-background scale-110 shadow-soft"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className={cn(
                "text-[10px] font-bold transition-all",
                isActive && "scale-105"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

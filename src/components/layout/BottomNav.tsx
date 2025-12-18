import { Link, useLocation } from "react-router-dom";
import { BookOpen, Newspaper, Search, PenLine, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/materials", label: "Materials", icon: BookOpen },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/leaderboard", label: "Search", icon: Search, highlight: true },
  { href: "/blogs", label: "Blogs", icon: PenLine },
  { href: "/books", label: "Books", icon: ArrowLeftRight },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  item.highlight && !isActive && "bg-primary/10",
                  item.highlight && isActive && "bg-primary text-primary-foreground",
                  isActive && !item.highlight && "bg-accent"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

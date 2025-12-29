import { useLocation, useNavigate } from "react-router-dom";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import { LayoutDashboard, Calendar, ScanLine, Users, MoreHorizontal, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

// Organizer-specific bottom nav items
const navItems = [
  { href: "/organizer", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/organizer/events", label: "Events", icon: Calendar },
  { href: "/organizer/scan", label: "Scan", icon: ScanLine, highlight: true },
  { href: "/organizer/volunteers", label: "Volunteers", icon: Users },
];

const moreItems = [
  { href: "/organizer/analytics", label: "Analytics" },
  { href: "/organizer/settings", label: "Settings" },
  { href: "/dashboard", label: "User Dashboard" },
  { href: "/", label: "Home" },
];

interface OrganizerBottomNavProps {
  showBackButton?: boolean;
  backPath?: string;
  selectedEventId?: string;
}

export function OrganizerBottomNav({ 
  showBackButton = false, 
  backPath = "/organizer",
  selectedEventId 
}: OrganizerBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  // Only show on organizer pages and mobile
  if (!location.pathname.startsWith("/organizer")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 h-auto"
            onClick={() => navigate(backPath)}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Back</span>
          </Button>
        )}
        
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);
          const Icon = item.icon;
          
          // For scan, use the selected event if available
          const href = item.href === "/organizer/scan" && selectedEventId 
            ? `/organizer/check-in/${selectedEventId}` 
            : item.href;
          
          return (
            <PrefetchLink
              key={item.href}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 active:scale-95"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                  item.highlight && "bg-primary text-primary-foreground shadow-lg",
                  isActive && !item.highlight && "bg-foreground text-background shadow-md",
                  !isActive && !item.highlight && "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>{item.label}</span>
            </PrefetchLink>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {moreItems.map((item) => (
                <Button
                  key={item.href}
                  variant="outline"
                  className="h-14 justify-start"
                  onClick={() => {
                    navigate(item.href);
                    setMoreOpen(false);
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

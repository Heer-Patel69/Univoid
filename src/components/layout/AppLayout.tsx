import { memo } from "react";
import { Outlet, Link } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { BottomNav } from "./BottomNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Menu } from "lucide-react";

// Memoized background component - renders once
const PaperBackground = memo(() => (
  <div className="fixed inset-0 bg-sketch paper-texture pointer-events-none -z-10" aria-hidden="true" />
));
PaperBackground.displayName = "PaperBackground";

// Memoized sidebar - only re-renders when auth state changes
const MemoizedSidebar = memo(() => <DashboardSidebar />);
MemoizedSidebar.displayName = "MemoizedSidebar";

// Mobile sidebar component
const MobileSidebar = memo(() => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu className="w-5 h-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="p-0 w-72 overflow-y-auto">
      <DashboardSidebar isMobile />
    </SheetContent>
  </Sheet>
));
MobileSidebar.displayName = "MobileSidebar";

/**
 * AppLayout - Persistent layout shell for authenticated routes
 * The sidebar and background remain static while only the Outlet (main content) changes
 */
const AppLayout = () => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Static Paper Background */}
      <PaperBackground />
      
      {/* Sidebar - Desktop (persistent, never re-renders on navigation) */}
      <MemoizedSidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen overflow-auto relative z-10">
        {/* Mobile Header - Persistent */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
          <MobileSidebar />
          <Link to="/" className="font-bold text-lg">UniVoid</Link>
          <ThemeToggle className="rounded-xl" />
        </header>

        {/* Page Content - This is the ONLY part that changes on navigation */}
        <Outlet />
      </main>

      {/* Bottom Nav - Mobile (persistent) */}
      <BottomNav />
    </div>
  );
};

export default memo(AppLayout);

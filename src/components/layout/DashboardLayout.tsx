import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/**
 * DashboardLayout - Persistent layout shell for dashboard/internal pages
 * Sidebar and mobile header stay mounted during navigation
 */
const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex bg-background paper-texture">
      {/* Sidebar - Desktop (persistent) */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto relative z-10 flex flex-col">
        {/* Mobile Header (persistent) */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 overflow-y-auto">
              <DashboardSidebar isMobile />
            </SheetContent>
          </Sheet>
          <Link to="/" className="font-bold text-lg">UniVoid</Link>
          <ThemeToggle className="rounded-xl" />
        </header>

        {/* Page content renders here via Outlet - only this part changes */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default DashboardLayout;

import { memo } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { BottomNav } from "./BottomNav";

// Memoized background component - renders once
const PaperBackground = memo(() => (
  <div className="fixed inset-0 bg-sketch paper-texture pointer-events-none -z-10" aria-hidden="true" />
));
PaperBackground.displayName = "PaperBackground";

// Memoized header - only re-renders when auth state changes
const MemoizedHeader = memo(({ onAuthClick }: { onAuthClick: () => void }) => (
  <Header onAuthClick={onAuthClick} />
));
MemoizedHeader.displayName = "MemoizedHeader";

// Memoized footer
const MemoizedFooter = memo(() => <Footer />);
MemoizedFooter.displayName = "MemoizedFooter";

interface PublicLayoutProps {
  onAuthClick: () => void;
}

/**
 * PublicLayout - Persistent layout shell for public routes
 * Header, Footer, and background remain static while only the Outlet (main content) changes
 */
const PublicLayout = ({ onAuthClick }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0">
      {/* Static Paper Background */}
      <PaperBackground />
      
      {/* Header - Persistent */}
      <MemoizedHeader onAuthClick={onAuthClick} />

      {/* Page Content - This is the ONLY part that changes on navigation */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer - Persistent */}
      <MemoizedFooter />

      {/* Bottom Nav - Mobile (persistent) */}
      <BottomNav />
    </div>
  );
};

export default memo(PublicLayout);

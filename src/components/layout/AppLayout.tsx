import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { useState, useCallback } from "react";
import AuthModal from "@/components/auth/AuthModal";
import { FloatingDoodles } from "@/components/common/FloatingDoodles";

/**
 * AppLayout - Persistent layout shell for public pages
 * This component stays mounted during navigation, preventing re-renders of Header/Footer
 */
const AppLayout = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthClick = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const handleAuthClose = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-background paper-texture w-full max-w-full overflow-x-hidden relative pb-20 md:pb-0">
      {/* Global floating doodles background */}
      <FloatingDoodles density="global" className="fixed inset-0" />
      
      <Header onAuthClick={handleAuthClick} />
      
      {/* Main content with proper spacing for sticky header */}
      <main className="flex-1 w-full max-w-full relative z-10">
        <Suspense fallback={null}>
          <Outlet context={{ onAuthClick: handleAuthClick }} />
        </Suspense>
      </main>

      <Footer />
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleAuthClose} 
      />
    </div>
  );
};

export default AppLayout;

import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState, useCallback } from "react";
import AuthModal from "@/components/auth/AuthModal";

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
    <div className="min-h-screen flex flex-col bg-background paper-texture">
      <Header onAuthClick={handleAuthClick} />
      
      <main className="flex-1">
        <Suspense fallback={null}>
          <Outlet context={{ onAuthClick: handleAuthClick }} />
        </Suspense>
      </main>

      <Footer />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={handleAuthClose} 
      />
    </div>
  );
};

export default AppLayout;

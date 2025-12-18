import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { EmailVerificationPending } from "./EmailVerificationPending";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Store the attempted URL for redirect after login
    return <Navigate to="/?auth=login" state={{ from: location.pathname }} replace />;
  }

  // Check if email is verified
  const isGoogleUser = user.app_metadata?.provider === 'google';
  const emailConfirmed = user.email_confirmed_at !== null;
  const isVerified = isGoogleUser || emailConfirmed;

  if (!isVerified) {
    return <EmailVerificationPending email={user.email || ''} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

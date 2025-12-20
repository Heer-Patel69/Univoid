import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CookieConsent } from "@/components/common/CookieConsent";
import { GlobalRealtimeProvider } from "@/components/common/GlobalRealtimeProvider";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { FeatureHints } from "@/components/onboarding/FeatureHints";
import { AnimatedRoutes } from "@/components/common/AnimatedRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary showDetails>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <GlobalRealtimeProvider>
                <ErrorBoundary>
                  <AnimatedRoutes />
                </ErrorBoundary>
                <CookieConsent />
                <PushNotificationPrompt />
                <OnboardingTour />
                <FeatureHints />
              </GlobalRealtimeProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;

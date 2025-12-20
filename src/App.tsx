import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { CookieConsent } from "@/components/common/CookieConsent";
import CheckInRedirect from "@/components/common/CheckInRedirect";
import { GlobalRealtimeProvider } from "@/components/common/GlobalRealtimeProvider";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

import Index from "./pages/Index";
import Materials from "./pages/Materials";
import News from "./pages/News";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import UploadMaterial from "./pages/UploadMaterial";
import SubmitNews from "./pages/SubmitNews";
import ListBook from "./pages/ListBook";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import CreateEvent from "./pages/CreateEvent";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import MyTickets from "./pages/MyTickets";
import BecomeOrganizer from "./pages/BecomeOrganizer";
import EditEvent from "./pages/EditEvent";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import CreateTask from "./pages/CreateTask";
import EventCheckIn from "./pages/EventCheckIn";
import Settings from "./pages/Settings";
import Scholarships from "./pages/Scholarships";
import ScholarshipDetail from "./pages/ScholarshipDetail";

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
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/onboarding" element={<ProtectedRoute skipOnboarding><Onboarding /></ProtectedRoute>} />
                    <Route path="/my-events" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
                    <Route path="/checkin/:token" element={<CheckInRedirect />} />
                    <Route path="/materials" element={<Materials />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/books" element={<Books />} />
                    <Route path="/books/:bookId" element={<BookDetail />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:eventId" element={<EventDetail />} />
                    <Route path="/scholarships" element={<Scholarships />} />
                    <Route path="/scholarships/:scholarshipId" element={<ScholarshipDetail />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/create" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
                    <Route path="/projects/:projectId" element={<ProjectDetail />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/tasks/my-requests" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                    <Route path="/tasks/:taskId" element={<TaskDetail />} />
                    <Route path="/tasks/create" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
                    <Route path="/become-organizer" element={<BecomeOrganizer />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/dashboard/upload-material" element={<ProtectedRoute><UploadMaterial /></ProtectedRoute>} />
                    <Route path="/dashboard/submit-news" element={<ProtectedRoute><SubmitNews /></ProtectedRoute>} />
                    <Route path="/dashboard/list-book" element={<ProtectedRoute><ListBook /></ProtectedRoute>} />
                    <Route path="/dashboard/my-tickets" element={<Navigate to="/my-events" replace />} />
                    <Route path="/upload-material" element={<ProtectedRoute><UploadMaterial /></ProtectedRoute>} />
                    <Route path="/submit-news" element={<ProtectedRoute><SubmitNews /></ProtectedRoute>} />
                    <Route path="/sell-book" element={<ProtectedRoute><ListBook /></ProtectedRoute>} />
                    <Route path="/organizer/dashboard" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
                    <Route path="/organizer/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
                    <Route path="/organizer/edit-event/:eventId" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
                    <Route path="/organizer/check-in/:eventId" element={<ProtectedRoute><EventCheckIn /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
                <CookieConsent />
                <PushNotificationPrompt />
                <OnboardingTour />
              </GlobalRealtimeProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { CookieConsent } from "@/components/common/CookieConsent";
import Index from "./pages/Index";
import Materials from "./pages/Materials";
import News from "./pages/News";
import Blogs from "./pages/Blogs";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import UploadMaterial from "./pages/UploadMaterial";
import WriteBlog from "./pages/WriteBlog";
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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/news" element={<News />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/books" element={<Books />} />
            <Route path="/books/:bookId" element={<BookDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/become-organizer" element={<BecomeOrganizer />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/upload-material" element={<ProtectedRoute><UploadMaterial /></ProtectedRoute>} />
            <Route path="/dashboard/write-blog" element={<ProtectedRoute><WriteBlog /></ProtectedRoute>} />
            <Route path="/dashboard/submit-news" element={<ProtectedRoute><SubmitNews /></ProtectedRoute>} />
            <Route path="/dashboard/list-book" element={<ProtectedRoute><ListBook /></ProtectedRoute>} />
            <Route path="/dashboard/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
            <Route path="/upload-material" element={<ProtectedRoute><UploadMaterial /></ProtectedRoute>} />
            <Route path="/submit-blog" element={<ProtectedRoute><WriteBlog /></ProtectedRoute>} />
            <Route path="/submit-news" element={<ProtectedRoute><SubmitNews /></ProtectedRoute>} />
            <Route path="/sell-book" element={<ProtectedRoute><ListBook /></ProtectedRoute>} />
            <Route path="/organizer/dashboard" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />
            <Route path="/organizer/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
            <Route path="/organizer/edit-event/:eventId" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

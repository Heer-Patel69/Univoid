import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CheckInRedirect from "@/components/common/CheckInRedirect";
import AppLayout from "@/components/layout/AppLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Lazy load pages for better code splitting
const Index = lazy(() => import("@/pages/Index"));
const Materials = lazy(() => import("@/pages/Materials"));
const News = lazy(() => import("@/pages/News"));
const Books = lazy(() => import("@/pages/Books"));
const BookDetail = lazy(() => import("@/pages/BookDetail"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Profile = lazy(() => import("@/pages/Profile"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const UploadMaterial = lazy(() => import("@/pages/UploadMaterial"));
const SubmitNews = lazy(() => import("@/pages/SubmitNews"));
const ListBook = lazy(() => import("@/pages/ListBook"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/Terms"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const LegalDisclaimer = lazy(() => import("@/pages/LegalDisclaimer"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const Contact = lazy(() => import("@/pages/Contact"));
const Events = lazy(() => import("@/pages/Events"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const CreateEvent = lazy(() => import("@/pages/CreateEvent"));
const OrganizerDashboard = lazy(() => import("@/pages/OrganizerDashboard"));
const MyTickets = lazy(() => import("@/pages/MyTickets"));
const BecomeOrganizer = lazy(() => import("@/pages/BecomeOrganizer"));
const EditEvent = lazy(() => import("@/pages/EditEvent"));
const Projects = lazy(() => import("@/pages/Projects"));
const CreateProject = lazy(() => import("@/pages/CreateProject"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const TaskDetail = lazy(() => import("@/pages/TaskDetail"));
const CreateTask = lazy(() => import("@/pages/CreateTask"));
const EventCheckIn = lazy(() => import("@/pages/EventCheckIn"));
const Settings = lazy(() => import("@/pages/Settings"));
// Preload critical pages after initial render
const preloadCriticalPages = () => {
  // Preload most commonly visited pages
  import("@/pages/Dashboard");
  import("@/pages/Materials");
  import("@/pages/Events");
};

// Minimal loading - null for instant feel
const MinimalLoader = () => null;

export const AnimatedRoutes = () => {
  // Preload critical pages after initial mount
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preloadCriticalPages);
    } else {
      setTimeout(preloadCriticalPages, 1000);
    }
  }, []);

  return (
    <Routes>
      {/* Landing page - no layout wrapper needed */}
      <Route path="/" element={
        <Suspense fallback={<MinimalLoader />}>
          <Index />
        </Suspense>
      } />

      {/* Public pages with persistent AppLayout (Header/Footer) */}
      <Route element={<AppLayout />}>
        <Route path="/materials" element={
          <Suspense fallback={<MinimalLoader />}><Materials /></Suspense>
        } />
        <Route path="/news" element={
          <Suspense fallback={<MinimalLoader />}><News /></Suspense>
        } />
        <Route path="/books" element={
          <Suspense fallback={<MinimalLoader />}><Books /></Suspense>
        } />
        <Route path="/books/:bookId" element={
          <Suspense fallback={<MinimalLoader />}><BookDetail /></Suspense>
        } />
        <Route path="/events" element={
          <Suspense fallback={<MinimalLoader />}><Events /></Suspense>
        } />
        <Route path="/events/:eventId" element={
          <Suspense fallback={<MinimalLoader />}><EventDetail /></Suspense>
        } />
        <Route path="/projects" element={
          <Suspense fallback={<MinimalLoader />}><Projects /></Suspense>
        } />
        <Route path="/projects/:projectId" element={
          <Suspense fallback={<MinimalLoader />}><ProjectDetail /></Suspense>
        } />
        <Route path="/tasks" element={
          <Suspense fallback={<MinimalLoader />}><Tasks /></Suspense>
        } />
        <Route path="/tasks/:taskId" element={
          <Suspense fallback={<MinimalLoader />}><TaskDetail /></Suspense>
        } />
        <Route path="/leaderboard" element={
          <Suspense fallback={<MinimalLoader />}><Leaderboard /></Suspense>
        } />
        <Route path="/become-organizer" element={
          <Suspense fallback={<MinimalLoader />}><BecomeOrganizer /></Suspense>
        } />
        <Route path="/profile/:userId" element={
          <Suspense fallback={<MinimalLoader />}><Profile /></Suspense>
        } />
        {/* Legal pages */}
        <Route path="/privacy-policy" element={
          <Suspense fallback={<MinimalLoader />}><PrivacyPolicy /></Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<MinimalLoader />}><Terms /></Suspense>
        } />
        <Route path="/refund-policy" element={
          <Suspense fallback={<MinimalLoader />}><RefundPolicy /></Suspense>
        } />
        <Route path="/legal-disclaimer" element={
          <Suspense fallback={<MinimalLoader />}><LegalDisclaimer /></Suspense>
        } />
        <Route path="/cookie-policy" element={
          <Suspense fallback={<MinimalLoader />}><CookiePolicy /></Suspense>
        } />
        <Route path="/contact" element={
          <Suspense fallback={<MinimalLoader />}><Contact /></Suspense>
        } />
      </Route>

      {/* Dashboard pages with persistent DashboardLayout (Sidebar) */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={
          <Suspense fallback={<MinimalLoader />}><Dashboard /></Suspense>
        } />
        <Route path="/profile" element={
          <Suspense fallback={<MinimalLoader />}><Profile /></Suspense>
        } />
        <Route path="/profile/edit" element={
          <Suspense fallback={<MinimalLoader />}><EditProfile /></Suspense>
        } />
        <Route path="/settings" element={
          <Suspense fallback={<MinimalLoader />}><Settings /></Suspense>
        } />
        <Route path="/my-events" element={
          <Suspense fallback={<MinimalLoader />}><MyTickets /></Suspense>
        } />
        <Route path="/upload-material" element={
          <Suspense fallback={<MinimalLoader />}><UploadMaterial /></Suspense>
        } />
        <Route path="/submit-news" element={
          <Suspense fallback={<MinimalLoader />}><SubmitNews /></Suspense>
        } />
        <Route path="/sell-book" element={
          <Suspense fallback={<MinimalLoader />}><ListBook /></Suspense>
        } />
        <Route path="/projects/create" element={
          <Suspense fallback={<MinimalLoader />}><CreateProject /></Suspense>
        } />
        <Route path="/tasks/create" element={
          <Suspense fallback={<MinimalLoader />}><CreateTask /></Suspense>
        } />
        <Route path="/tasks/my-requests" element={
          <Suspense fallback={<MinimalLoader />}><Tasks /></Suspense>
        } />
        {/* Legacy dashboard routes */}
        <Route path="/dashboard/upload-material" element={
          <Suspense fallback={<MinimalLoader />}><UploadMaterial /></Suspense>
        } />
        <Route path="/dashboard/submit-news" element={
          <Suspense fallback={<MinimalLoader />}><SubmitNews /></Suspense>
        } />
        <Route path="/dashboard/list-book" element={
          <Suspense fallback={<MinimalLoader />}><ListBook /></Suspense>
        } />
        <Route path="/dashboard/my-tickets" element={<Navigate to="/my-events" replace />} />
      </Route>

      {/* Organizer pages with DashboardLayout */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/organizer/dashboard" element={
          <Suspense fallback={<MinimalLoader />}><OrganizerDashboard /></Suspense>
        } />
        <Route path="/organizer/create-event" element={
          <Suspense fallback={<MinimalLoader />}><CreateEvent /></Suspense>
        } />
        <Route path="/organizer/edit-event/:eventId" element={
          <Suspense fallback={<MinimalLoader />}><EditEvent /></Suspense>
        } />
        <Route path="/organizer/check-in/:eventId" element={
          <Suspense fallback={<MinimalLoader />}><EventCheckIn /></Suspense>
        } />
      </Route>

      {/* Admin with DashboardLayout */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin" element={
          <Suspense fallback={<MinimalLoader />}><Admin /></Suspense>
        } />
      </Route>

      {/* Onboarding - special case */}
      <Route path="/onboarding" element={
        <ProtectedRoute skipOnboarding>
          <Suspense fallback={<MinimalLoader />}><Onboarding /></Suspense>
        </ProtectedRoute>
      } />

      {/* Check-in redirect */}
      <Route path="/checkin/:token" element={<CheckInRedirect />} />

      {/* 404 */}
      <Route path="*" element={
        <Suspense fallback={<MinimalLoader />}><NotFound /></Suspense>
      } />
    </Routes>
  );
};

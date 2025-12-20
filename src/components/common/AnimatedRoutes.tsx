import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy, useState, useCallback, memo } from "react";
import { PageTransition } from "./PageTransition";
import { PageSkeleton } from "./PageSkeleton";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CheckInRedirect from "@/components/common/CheckInRedirect";
import AppLayout from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import AuthModal from "@/components/auth/AuthModal";

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
const Scholarships = lazy(() => import("@/pages/Scholarships"));
const ScholarshipDetail = lazy(() => import("@/pages/ScholarshipDetail"));

// Skeleton wrapper for different page types - memoized
const GridPageSkeleton = memo(() => <PageSkeleton variant="grid" showFilters />);
const DetailPageSkeleton = memo(() => <PageSkeleton variant="detail" showFilters={false} />);
const DashboardPageSkeleton = memo(() => <PageSkeleton variant="dashboard" showFilters={false} />);
const ListPageSkeleton = memo(() => <PageSkeleton variant="list" showFilters />);

GridPageSkeleton.displayName = "GridPageSkeleton";
DetailPageSkeleton.displayName = "DetailPageSkeleton";
DashboardPageSkeleton.displayName = "DashboardPageSkeleton";
ListPageSkeleton.displayName = "ListPageSkeleton";

// Wrapper for page content with suspense and transition
const PageWrapper = memo(({ 
  children, 
  skeleton: Skeleton = GridPageSkeleton 
}: { 
  children: React.ReactNode; 
  skeleton?: React.ComponentType;
}) => (
  <Suspense fallback={<Skeleton />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
));
PageWrapper.displayName = "PageWrapper";

export const AnimatedRoutes = memo(() => {
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  
  const handleAuthClick = useCallback(() => setAuthOpen(true), []);
  const handleAuthClose = useCallback(() => setAuthOpen(false), []);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Landing page - standalone with its own layout */}
          <Route path="/" element={
            <PageWrapper skeleton={GridPageSkeleton}>
              <Index />
            </PageWrapper>
          } />

          {/* Public routes with PublicLayout shell */}
          <Route element={<PublicLayout onAuthClick={handleAuthClick} />}>
            <Route path="/materials" element={
              <PageWrapper skeleton={GridPageSkeleton}>
                <Materials />
              </PageWrapper>
            } />
            <Route path="/news" element={
              <PageWrapper skeleton={GridPageSkeleton}>
                <News />
              </PageWrapper>
            } />
            <Route path="/books" element={
              <PageWrapper skeleton={GridPageSkeleton}>
                <Books />
              </PageWrapper>
            } />
            <Route path="/books/:bookId" element={
              <PageWrapper skeleton={DetailPageSkeleton}>
                <BookDetail />
              </PageWrapper>
            } />
            <Route path="/events" element={
              <PageWrapper skeleton={GridPageSkeleton}>
                <Events />
              </PageWrapper>
            } />
            <Route path="/events/:eventId" element={
              <PageWrapper skeleton={DetailPageSkeleton}>
                <EventDetail />
              </PageWrapper>
            } />
            <Route path="/scholarships" element={
              <PageWrapper skeleton={GridPageSkeleton}>
                <Scholarships />
              </PageWrapper>
            } />
            <Route path="/scholarships/:scholarshipId" element={
              <PageWrapper skeleton={DetailPageSkeleton}>
                <ScholarshipDetail />
              </PageWrapper>
            } />
            <Route path="/projects" element={
              <PageWrapper skeleton={GridPageSkeleton}>
                <Projects />
              </PageWrapper>
            } />
            <Route path="/projects/:projectId" element={
              <PageWrapper skeleton={DetailPageSkeleton}>
                <ProjectDetail />
              </PageWrapper>
            } />
            <Route path="/tasks" element={
              <PageWrapper skeleton={GridPageSkeleton}>
                <Tasks />
              </PageWrapper>
            } />
            <Route path="/tasks/:taskId" element={
              <PageWrapper skeleton={DetailPageSkeleton}>
                <TaskDetail />
              </PageWrapper>
            } />
            <Route path="/leaderboard" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <Leaderboard />
              </PageWrapper>
            } />
            <Route path="/become-organizer" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <BecomeOrganizer />
              </PageWrapper>
            } />
            <Route path="/profile/:userId" element={
              <PageWrapper skeleton={DetailPageSkeleton}>
                <Profile />
              </PageWrapper>
            } />
            {/* Legal pages */}
            <Route path="/privacy-policy" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <PrivacyPolicy />
              </PageWrapper>
            } />
            <Route path="/terms" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <Terms />
              </PageWrapper>
            } />
            <Route path="/refund-policy" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <RefundPolicy />
              </PageWrapper>
            } />
            <Route path="/legal-disclaimer" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <LegalDisclaimer />
              </PageWrapper>
            } />
            <Route path="/cookie-policy" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <CookiePolicy />
              </PageWrapper>
            } />
            <Route path="/contact" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <Contact />
              </PageWrapper>
            } />
          </Route>

          {/* Protected routes with AppLayout shell (sidebar) */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={
              <PageWrapper skeleton={DashboardPageSkeleton}>
                <Dashboard />
              </PageWrapper>
            } />
            <Route path="/profile" element={
              <PageWrapper skeleton={DetailPageSkeleton}>
                <Profile />
              </PageWrapper>
            } />
            <Route path="/profile/edit" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <EditProfile />
              </PageWrapper>
            } />
            <Route path="/settings" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <Settings />
              </PageWrapper>
            } />
            <Route path="/my-events" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <MyTickets />
              </PageWrapper>
            } />
            <Route path="/upload-material" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <UploadMaterial />
              </PageWrapper>
            } />
            <Route path="/dashboard/upload-material" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <UploadMaterial />
              </PageWrapper>
            } />
            <Route path="/submit-news" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <SubmitNews />
              </PageWrapper>
            } />
            <Route path="/dashboard/submit-news" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <SubmitNews />
              </PageWrapper>
            } />
            <Route path="/sell-book" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <ListBook />
              </PageWrapper>
            } />
            <Route path="/dashboard/list-book" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <ListBook />
              </PageWrapper>
            } />
            <Route path="/projects/create" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <CreateProject />
              </PageWrapper>
            } />
            <Route path="/tasks/create" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <CreateTask />
              </PageWrapper>
            } />
            <Route path="/tasks/my-requests" element={
              <PageWrapper skeleton={GridPageSkeleton}>
                <Tasks />
              </PageWrapper>
            } />
          </Route>

          {/* Organizer routes with AppLayout */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/organizer/dashboard" element={
              <PageWrapper skeleton={DashboardPageSkeleton}>
                <OrganizerDashboard />
              </PageWrapper>
            } />
            <Route path="/organizer/create-event" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <CreateEvent />
              </PageWrapper>
            } />
            <Route path="/organizer/edit-event/:eventId" element={
              <PageWrapper skeleton={DetailPageSkeleton}>
                <EditEvent />
              </PageWrapper>
            } />
            <Route path="/organizer/check-in/:eventId" element={
              <PageWrapper skeleton={ListPageSkeleton}>
                <EventCheckIn />
              </PageWrapper>
            } />
          </Route>

          {/* Onboarding - special protected route */}
          <Route path="/onboarding" element={
            <ProtectedRoute skipOnboarding>
              <PageWrapper skeleton={ListPageSkeleton}>
                <Onboarding />
              </PageWrapper>
            </ProtectedRoute>
          } />

          {/* Admin route */}
          <Route path="/admin" element={
            <PageWrapper skeleton={DashboardPageSkeleton}>
              <Admin />
            </PageWrapper>
          } />

          {/* Check-in redirect */}
          <Route path="/checkin/:token" element={<CheckInRedirect />} />

          {/* Legacy redirects */}
          <Route path="/dashboard/my-tickets" element={<Navigate to="/my-events" replace />} />

          {/* 404 */}
          <Route path="*" element={
            <PageWrapper skeleton={GridPageSkeleton}>
              <NotFound />
            </PageWrapper>
          } />
        </Routes>
      </AnimatePresence>

      {/* Auth Modal - Global */}
      <AuthModal isOpen={authOpen} onClose={handleAuthClose} />
    </>
  );
});

AnimatedRoutes.displayName = "AnimatedRoutes";

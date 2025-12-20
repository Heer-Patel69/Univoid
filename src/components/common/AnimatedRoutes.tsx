import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";
import { PageTransition } from "./PageTransition";
import { PageSkeleton } from "./PageSkeleton";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CheckInRedirect from "@/components/common/CheckInRedirect";

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

// Skeleton wrapper for different page types
const GridPageSkeleton = () => <PageSkeleton variant="grid" showFilters />;
const DetailPageSkeleton = () => <PageSkeleton variant="detail" showFilters={false} />;
const DashboardPageSkeleton = () => <PageSkeleton variant="dashboard" showFilters={false} />;
const ListPageSkeleton = () => <PageSkeleton variant="list" showFilters />;

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><Index /></PageTransition>
          </Suspense>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute skipOnboarding>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><Onboarding /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/my-events" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><MyTickets /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/checkin/:token" element={<CheckInRedirect />} />
        <Route path="/materials" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><Materials /></PageTransition>
          </Suspense>
        } />
        <Route path="/news" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><News /></PageTransition>
          </Suspense>
        } />
        <Route path="/books" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><Books /></PageTransition>
          </Suspense>
        } />
        <Route path="/books/:bookId" element={
          <Suspense fallback={<DetailPageSkeleton />}>
            <PageTransition><BookDetail /></PageTransition>
          </Suspense>
        } />
        <Route path="/events" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><Events /></PageTransition>
          </Suspense>
        } />
        <Route path="/events/:eventId" element={
          <Suspense fallback={<DetailPageSkeleton />}>
            <PageTransition><EventDetail /></PageTransition>
          </Suspense>
        } />
        <Route path="/scholarships" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><Scholarships /></PageTransition>
          </Suspense>
        } />
        <Route path="/scholarships/:scholarshipId" element={
          <Suspense fallback={<DetailPageSkeleton />}>
            <PageTransition><ScholarshipDetail /></PageTransition>
          </Suspense>
        } />
        <Route path="/projects" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><Projects /></PageTransition>
          </Suspense>
        } />
        <Route path="/projects/create" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><CreateProject /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/projects/:projectId" element={
          <Suspense fallback={<DetailPageSkeleton />}>
            <PageTransition><ProjectDetail /></PageTransition>
          </Suspense>
        } />
        <Route path="/tasks" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><Tasks /></PageTransition>
          </Suspense>
        } />
        <Route path="/tasks/my-requests" element={
          <ProtectedRoute>
            <Suspense fallback={<GridPageSkeleton />}>
              <PageTransition><Tasks /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/tasks/:taskId" element={
          <Suspense fallback={<DetailPageSkeleton />}>
            <PageTransition><TaskDetail /></PageTransition>
          </Suspense>
        } />
        <Route path="/tasks/create" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><CreateTask /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/become-organizer" element={
          <Suspense fallback={<ListPageSkeleton />}>
            <PageTransition><BecomeOrganizer /></PageTransition>
          </Suspense>
        } />
        <Route path="/leaderboard" element={
          <Suspense fallback={<ListPageSkeleton />}>
            <PageTransition><Leaderboard /></PageTransition>
          </Suspense>
        } />
        <Route path="/privacy-policy" element={
          <Suspense fallback={<ListPageSkeleton />}>
            <PageTransition><PrivacyPolicy /></PageTransition>
          </Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={<ListPageSkeleton />}>
            <PageTransition><Terms /></PageTransition>
          </Suspense>
        } />
        <Route path="/refund-policy" element={
          <Suspense fallback={<ListPageSkeleton />}>
            <PageTransition><RefundPolicy /></PageTransition>
          </Suspense>
        } />
        <Route path="/legal-disclaimer" element={
          <Suspense fallback={<ListPageSkeleton />}>
            <PageTransition><LegalDisclaimer /></PageTransition>
          </Suspense>
        } />
        <Route path="/cookie-policy" element={
          <Suspense fallback={<ListPageSkeleton />}>
            <PageTransition><CookiePolicy /></PageTransition>
          </Suspense>
        } />
        <Route path="/contact" element={
          <Suspense fallback={<ListPageSkeleton />}>
            <PageTransition><Contact /></PageTransition>
          </Suspense>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<DashboardPageSkeleton />}>
              <PageTransition><Dashboard /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/upload-material" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><UploadMaterial /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/submit-news" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><SubmitNews /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/list-book" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><ListBook /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/my-tickets" element={<Navigate to="/my-events" replace />} />
        <Route path="/upload-material" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><UploadMaterial /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/submit-news" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><SubmitNews /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/sell-book" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><ListBook /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/organizer/dashboard" element={
          <ProtectedRoute>
            <Suspense fallback={<DashboardPageSkeleton />}>
              <PageTransition><OrganizerDashboard /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/organizer/create-event" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><CreateEvent /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/organizer/edit-event/:eventId" element={
          <ProtectedRoute>
            <Suspense fallback={<DetailPageSkeleton />}>
              <PageTransition><EditEvent /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/organizer/check-in/:eventId" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><EventCheckIn /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Suspense fallback={<DetailPageSkeleton />}>
              <PageTransition><Profile /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/profile/edit" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><EditProfile /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Suspense fallback={<ListPageSkeleton />}>
              <PageTransition><Settings /></PageTransition>
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/profile/:userId" element={
          <Suspense fallback={<DetailPageSkeleton />}>
            <PageTransition><Profile /></PageTransition>
          </Suspense>
        } />
        <Route path="/admin" element={
          <Suspense fallback={<DashboardPageSkeleton />}>
            <PageTransition><Admin /></PageTransition>
          </Suspense>
        } />
        <Route path="*" element={
          <Suspense fallback={<GridPageSkeleton />}>
            <PageTransition><NotFound /></PageTransition>
          </Suspense>
        } />
      </Routes>
    </AnimatePresence>
  );
};

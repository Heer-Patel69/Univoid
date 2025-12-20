import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "./PageTransition";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CheckInRedirect from "@/components/common/CheckInRedirect";

import Index from "@/pages/Index";
import Materials from "@/pages/Materials";
import News from "@/pages/News";
import Books from "@/pages/Books";
import BookDetail from "@/pages/BookDetail";
import Leaderboard from "@/pages/Leaderboard";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import UploadMaterial from "@/pages/UploadMaterial";
import SubmitNews from "@/pages/SubmitNews";
import ListBook from "@/pages/ListBook";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import RefundPolicy from "@/pages/RefundPolicy";
import LegalDisclaimer from "@/pages/LegalDisclaimer";
import CookiePolicy from "@/pages/CookiePolicy";
import Contact from "@/pages/Contact";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import CreateEvent from "@/pages/CreateEvent";
import OrganizerDashboard from "@/pages/OrganizerDashboard";
import MyTickets from "@/pages/MyTickets";
import BecomeOrganizer from "@/pages/BecomeOrganizer";
import EditEvent from "@/pages/EditEvent";
import Projects from "@/pages/Projects";
import CreateProject from "@/pages/CreateProject";
import ProjectDetail from "@/pages/ProjectDetail";
import Tasks from "@/pages/Tasks";
import TaskDetail from "@/pages/TaskDetail";
import CreateTask from "@/pages/CreateTask";
import EventCheckIn from "@/pages/EventCheckIn";
import Settings from "@/pages/Settings";
import Scholarships from "@/pages/Scholarships";
import ScholarshipDetail from "@/pages/ScholarshipDetail";

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/onboarding" element={<ProtectedRoute skipOnboarding><PageTransition><Onboarding /></PageTransition></ProtectedRoute>} />
        <Route path="/my-events" element={<ProtectedRoute><PageTransition><MyTickets /></PageTransition></ProtectedRoute>} />
        <Route path="/checkin/:token" element={<CheckInRedirect />} />
        <Route path="/materials" element={<PageTransition><Materials /></PageTransition>} />
        <Route path="/news" element={<PageTransition><News /></PageTransition>} />
        <Route path="/books" element={<PageTransition><Books /></PageTransition>} />
        <Route path="/books/:bookId" element={<PageTransition><BookDetail /></PageTransition>} />
        <Route path="/events" element={<PageTransition><Events /></PageTransition>} />
        <Route path="/events/:eventId" element={<PageTransition><EventDetail /></PageTransition>} />
        <Route path="/scholarships" element={<PageTransition><Scholarships /></PageTransition>} />
        <Route path="/scholarships/:scholarshipId" element={<PageTransition><ScholarshipDetail /></PageTransition>} />
        <Route path="/projects" element={<PageTransition><Projects /></PageTransition>} />
        <Route path="/projects/create" element={<ProtectedRoute><PageTransition><CreateProject /></PageTransition></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<PageTransition><ProjectDetail /></PageTransition>} />
        <Route path="/tasks" element={<PageTransition><Tasks /></PageTransition>} />
        <Route path="/tasks/my-requests" element={<ProtectedRoute><PageTransition><Tasks /></PageTransition></ProtectedRoute>} />
        <Route path="/tasks/:taskId" element={<PageTransition><TaskDetail /></PageTransition>} />
        <Route path="/tasks/create" element={<ProtectedRoute><PageTransition><CreateTask /></PageTransition></ProtectedRoute>} />
        <Route path="/become-organizer" element={<PageTransition><BecomeOrganizer /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
        <Route path="/legal-disclaimer" element={<PageTransition><LegalDisclaimer /></PageTransition>} />
        <Route path="/cookie-policy" element={<PageTransition><CookiePolicy /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard/upload-material" element={<ProtectedRoute><PageTransition><UploadMaterial /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard/submit-news" element={<ProtectedRoute><PageTransition><SubmitNews /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard/list-book" element={<ProtectedRoute><PageTransition><ListBook /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard/my-tickets" element={<Navigate to="/my-events" replace />} />
        <Route path="/upload-material" element={<ProtectedRoute><PageTransition><UploadMaterial /></PageTransition></ProtectedRoute>} />
        <Route path="/submit-news" element={<ProtectedRoute><PageTransition><SubmitNews /></PageTransition></ProtectedRoute>} />
        <Route path="/sell-book" element={<ProtectedRoute><PageTransition><ListBook /></PageTransition></ProtectedRoute>} />
        <Route path="/organizer/dashboard" element={<ProtectedRoute><PageTransition><OrganizerDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/organizer/create-event" element={<ProtectedRoute><PageTransition><CreateEvent /></PageTransition></ProtectedRoute>} />
        <Route path="/organizer/edit-event/:eventId" element={<ProtectedRoute><PageTransition><EditEvent /></PageTransition></ProtectedRoute>} />
        <Route path="/organizer/check-in/:eventId" element={<ProtectedRoute><PageTransition><EventCheckIn /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><PageTransition><EditProfile /></PageTransition></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

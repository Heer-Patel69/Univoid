import { useEffect, useCallback, useRef } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useNavigate } from "react-router-dom";

// Tour steps configuration
const tourSteps: DriveStep[] = [
  // PHASE 1: THE HUB (Dashboard)
  {
    element: "#nav-dashboard",
    popover: {
      title: "Your Command Center",
      description: "Track your daily activity, XP progress, and latest updates here.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-materials",
    popover: {
      title: "Resource Library",
      description: "Download notes and study materials shared by peers.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-scholarships",
    popover: {
      title: "Fund Your Studies",
      description: "Exclusive India-only scholarships curated for your profile.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-events",
    popover: {
      title: "Campus Life",
      description: "Register for hackathons, fests, and grab your tickets.",
      side: "right",
      align: "start",
    },
  },
  // PHASE 2: CONTRIBUTE
  {
    element: "#btn-upload-material",
    popover: {
      title: "Share & Earn",
      description: "Upload notes or PDFs here. Help others and earn XP!",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#nav-projects",
    popover: {
      title: "Project Lab",
      description: "Collaborate on innovations. Find teammates or join existing builds.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#btn-create-project",
    popover: {
      title: "Build Something",
      description: "Have an idea? Click here to launch your startup or project page.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#nav-tasks",
    popover: {
      title: "Task Plaza",
      description: "Find gigs, internships, and student collaborations.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#btn-post-task",
    popover: {
      title: "Get Help",
      description: "Need a designer or coder? Post a task here to recruit talent.",
      side: "bottom",
      align: "center",
    },
  },
  // PHASE 3: BOOK EXCHANGE
  {
    element: "#nav-books",
    popover: {
      title: "Book Exchange",
      description: "Buy, sell, or swap books with students on your campus.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#btn-sell-book",
    popover: {
      title: "Declutter & Earn",
      description: "List your old textbooks for sale in seconds.",
      side: "bottom",
      align: "center",
    },
  },
  // PHASE 4: STAY UPDATED
  {
    element: "#nav-news",
    popover: {
      title: "Campus Feed",
      description: "Placements, news, and college announcements live here.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#notification-bell",
    popover: {
      title: "Real-time Alerts",
      description: "Never miss a scholarship deadline or event update.",
      side: "bottom",
      align: "end",
    },
  },
  // PHASE 5: YOU
  {
    element: "#nav-profile",
    popover: {
      title: "Your Identity",
      description: "Showcase your skills, interests, and badging.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-settings",
    popover: {
      title: "Control Center",
      description: "Manage preferences. You can also restart this tour from here!",
      side: "right",
      align: "start",
    },
  },
];

export function OnboardingTour() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const hasStartedRef = useRef(false);

  const markTourAsSeen = useCallback(async () => {
    if (!user) return;
    
    try {
      // Store in localStorage for immediate effect
      localStorage.setItem(`onboarding_tour_seen_${user.id}`, "true");
      
      // Also update profile metadata if we have a metadata column
      // For now, just use localStorage
    } catch (error) {
      console.error("Failed to mark tour as seen:", error);
    }
  }, [user]);

  const startTour = useCallback(() => {
    // Filter out steps whose elements don't exist
    const validSteps = tourSteps.filter((step) => {
      if (!step.element) return true;
      return document.querySelector(step.element as string) !== null;
    });

    if (validSteps.length === 0) return;

    const driverInstance = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: validSteps,
      progressText: "Step {{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Finish",
      popoverClass: "univoid-tour-popover",
      overlayColor: "rgba(0, 0, 0, 0.7)",
      stagePadding: 8,
      stageRadius: 12,
      animate: true,
      allowClose: true,
      onDestroyStarted: () => {
        markTourAsSeen();
        driverRef.current?.destroy();
      },
      onDestroyed: () => {
        hasStartedRef.current = false;
      },
    });

    driverRef.current = driverInstance;
    driverInstance.drive();
  }, [markTourAsSeen]);

  useEffect(() => {
    // Only run on dashboard
    if (location.pathname !== "/dashboard") return;
    
    // Need user and profile
    if (!user || !profile) return;
    
    // Check if profile is complete
    if (!profile.profile_complete) return;
    
    // Check if tour was already seen
    const tourSeen = localStorage.getItem(`onboarding_tour_seen_${user.id}`);
    if (tourSeen === "true") return;
    
    // Don't start twice
    if (hasStartedRef.current) return;
    
    // Give the DOM time to render all elements
    const timer = setTimeout(() => {
      hasStartedRef.current = true;
      startTour();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [user, profile, location.pathname, startTour]);

  return null;
}

// Function to manually trigger tour (for Settings page)
export function useOnboardingTour() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const restartTour = useCallback(() => {
    if (!user) return;
    
    // Clear the tour seen flag
    localStorage.removeItem(`onboarding_tour_seen_${user.id}`);
    
    // Navigate to dashboard and start tour
    navigate("/dashboard");
    
    // The tour will auto-start on dashboard
    window.location.reload();
  }, [user, navigate]);

  return { restartTour };
}

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, X, FileText, Folder, Briefcase, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Paths where FAB should NOT appear
const HIDDEN_PATHS = [
  "/admin",
  "/organizer",
  "/onboarding",
  "/upload-material",
  "/sell-book",
  "/projects/create",
  "/tasks/create",
];

export function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isOrganizer, isAdmin } = useAuth();
  const location = useLocation();

  // Don't show if not logged in
  if (!user) return null;

  // Hide on certain pages
  const shouldHide = HIDDEN_PATHS.some(path => location.pathname.startsWith(path));
  if (shouldHide) return null;

  // Define actions based on role
  const actions = [
    { href: "/upload-material", label: "Upload Material", icon: FileText },
    { href: "/projects/create", label: "Create Project", icon: Folder },
    { href: "/tasks/create", label: "Post Task", icon: Briefcase },
  ];

  // Add organizer action
  if (isOrganizer || isAdmin) {
    actions.push({ href: "/organizer/create-event", label: "Create Event", icon: Calendar });
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      {/* Action buttons */}
      <div className={cn(
        "flex flex-col-reverse gap-2 mb-3 transition-all duration-200",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 bg-card border border-border shadow-lg rounded-full pl-4 pr-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <span>{action.label}</span>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <action.icon className="w-4 h-4 text-primary-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95",
          isOpen && "rotate-45 bg-destructive"
        )}
        aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
      >
        {isOpen ? (
          <X className="w-6 h-6" strokeWidth={2.5} />
        ) : (
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}

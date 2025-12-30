import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";

const ProfileCompletionBanner = () => {
  const { profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if profile is complete or banner was dismissed
  if (!profile || profile.profile_complete || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Complete your profile to unlock all UniVoid features
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Add your college details, interests, and more
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/onboarding">
            <Button size="sm" variant="default">
              Complete Profile
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionBanner;

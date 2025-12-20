import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Edit } from "lucide-react";
import { Profile } from "@/types/database";

interface ProfileSnapshotProps {
  profile: Profile | null;
}

const ProfileSnapshot = ({ profile }: ProfileSnapshotProps) => {
  if (!profile) return null;

  const displayInterests = profile.interests?.slice(0, 3) || [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {profile.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt={profile.full_name}
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-foreground truncate">
              {profile.full_name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile.degree} • {profile.branch} • Year {profile.current_year}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {profile.college_name}
                {profile.city && `, ${profile.city}`}
              </span>
            </div>

            {/* Interest Tags */}
            {displayInterests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {displayInterests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2 py-0.5 bg-secondary text-xs font-medium rounded-full text-foreground"
                  >
                    {interest}
                  </span>
                ))}
                {profile.interests && profile.interests.length > 3 && (
                  <span className="px-2 py-0.5 bg-secondary text-xs font-medium rounded-full text-muted-foreground">
                    +{profile.interests.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Edit Button */}
          <Link to="/profile/edit">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="w-3 h-3" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSnapshot;

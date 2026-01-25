import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { hasOrganizerProfile, getOrganizerProfile, type OrganizerProfile } from "@/services/organizerService";

export function useOrganizerProfile() {
  const { user } = useAuth();
  
  const { data: hasProfile, isLoading: checkingProfile } = useQuery({
    queryKey: ['hasOrganizerProfile', user?.id],
    queryFn: () => hasOrganizerProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['organizerProfile', user?.id],
    queryFn: () => getOrganizerProfile(user!.id),
    enabled: !!user?.id && hasProfile === true,
    staleTime: 1000 * 60 * 5,
  });
  
  return {
    hasProfile: hasProfile ?? false,
    profile: profile ?? null,
    isLoading: checkingProfile || loadingProfile,
    checkingProfile,
    loadingProfile,
  };
}

export function useRequireOrganizerProfile() {
  const { hasProfile, isLoading } = useOrganizerProfile();
  
  return {
    hasProfile,
    isLoading,
    shouldRedirectToOnboarding: !isLoading && !hasProfile,
  };
}

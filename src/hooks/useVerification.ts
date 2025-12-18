import { useAuth } from '@/contexts/AuthContext';

export interface VerificationStatus {
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canContact: boolean;
}

export function useVerification(): VerificationStatus {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return {
      isVerified: false,
      emailVerified: false,
      phoneVerified: false,
      canUpload: false,
      canDownload: false,
      canContact: false,
    };
  }

  // Google auth users are auto email-verified
  const isGoogleUser = user.app_metadata?.provider === 'google';
  
  // Check if email is confirmed via Supabase auth
  const supabaseEmailConfirmed = user.email_confirmed_at !== null;
  
  // User is verified if: email confirmed OR phone verified OR Google auth
  const emailVerified = supabaseEmailConfirmed || isGoogleUser || (profile as any).email_verified === true;
  const phoneVerified = (profile as any).phone_verified === true;
  
  const isVerified = emailVerified || phoneVerified;

  return {
    isVerified,
    emailVerified,
    phoneVerified,
    canUpload: isVerified,
    canDownload: isVerified,
    canContact: isVerified,
  };
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchEventById, checkUserRegistration } from "@/services/eventsService";
import { 
  Zap, 
  Calendar, 
  MapPin, 
  Loader2, 
  Phone, 
  CheckCircle, 
  ArrowRight,
  Ticket,
  Clock
} from "lucide-react";

type Step = 'auth' | 'phone' | 'register' | 'complete';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FastRegister = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>('auth');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Fetch event data
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });

  // Check if user already registered
  const { data: existingRegistration, refetch: refetchRegistration } = useQuery({
    queryKey: ["registration", eventId, user?.id],
    queryFn: () => checkUserRegistration(eventId!, user!.id),
    enabled: !!eventId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Determine current step based on user state
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStep('auth');
    } else if (!profile?.phone_verified) {
      setStep('phone');
      // Pre-fill mobile number if exists
      if (profile?.mobile_number) {
        setMobileNumber(profile.mobile_number);
      }
    } else if (existingRegistration) {
      setStep('complete');
      // Fetch ticket ID
      fetchTicketId();
    } else {
      setStep('register');
    }
  }, [user, profile, authLoading, existingRegistration]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const fetchTicketId = async () => {
    if (!user || !eventId) return;
    const { data } = await supabase
      .from('event_tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();
    if (data) setTicketId(data.id);
  };

  const progress = step === 'auth' ? 25 : step === 'phone' ? 50 : step === 'register' ? 75 : 100;

  const handleGoogleSignIn = async () => {
    if (!eventId) return;
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/register/${eventId}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        toast({
          title: "Sign-in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isValidMobileNumber = (number: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(number.replace(/\s/g, ''));
  };

  const handleSendOtp = async () => {
    if (!isValidMobileNumber(mobileNumber)) {
      toast({
        title: "Invalid number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      // First update profile with mobile number
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ mobile_number: mobileNumber.replace(/\s/g, '') })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      // Then send OTP
      const { data, error } = await supabase.functions.invoke('phone-verification', {
        body: { action: 'send' }
      });

      if (error) throw error;

      if (data?.success) {
        setOtpSent(true);
        setCooldownSeconds(60);
        toast({
          title: "OTP Sent",
          description: "Check your phone for the verification code",
        });
      } else {
        throw new Error(data?.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('phone-verification', {
        body: { action: 'verify', otp }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Phone Verified!",
          description: "Your phone number has been verified",
        });
        if (refreshProfile) await refreshProfile();
        setStep('register');
      } else {
        throw new Error(data?.error || 'Verification failed');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!user || !eventId || !event) return;

    setIsRegistering(true);
    try {
      const { data, error } = await supabase.rpc('register_for_event_atomic', {
        p_event_id: eventId,
        p_user_id: user.id,
        p_custom_data: {},
        p_payment_screenshot_url: null
      });

      if (error) throw error;

      const result = data as { success: boolean; registration_id?: string; ticket_id?: string; error?: string };
      
      if (result.success) {
        toast({
          title: "Registration Complete! 🎉",
          description: "Your ticket has been generated",
        });
        setTicketId(result.ticket_id || null);
        await refetchRegistration();
        setStep('complete');
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Loading state
  if (eventLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Event not found
  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <h1 className="text-xl font-bold mb-4">Event Not Found</h1>
            <Link to="/events">
              <Button>Browse Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Progress */}
      <div className="w-full max-w-md mb-4">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center mt-2">
          Step {step === 'auth' ? 1 : step === 'phone' ? 2 : step === 'register' ? 3 : 4} of 4
        </p>
      </div>

      <Card className="w-full max-w-md overflow-hidden">
        {/* Event Header */}
        <div className="bg-primary px-6 py-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium">Quick Event Registration</span>
          </div>
          <h1 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(event.start_date), "MMM d, yyyy")}</span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{event.venue_name}</span>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          {/* Step: Google Auth */}
          {step === 'auth' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Sign in to Register</h2>
                <p className="text-sm text-muted-foreground">
                  Quick registration — no password needed
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full h-12 font-bold text-base"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="ml-3">Continue with Google</span>
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="text-foreground font-semibold hover:underline">Terms</Link>
                {" "}and{" "}
                <Link to="/privacy-policy" className="text-foreground font-semibold hover:underline">Privacy Policy</Link>
              </p>
            </div>
          )}

          {/* Step: Phone Verification */}
          {step === 'phone' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Verify Your Phone</h2>
                <p className="text-sm text-muted-foreground">
                  We'll send a verification code to your mobile
                </p>
              </div>

              {!otpSent ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                        <span className="text-sm text-muted-foreground">+91</span>
                      </div>
                      <Input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit number"
                        className="rounded-l-none"
                        maxLength={10}
                      />
                    </div>
                    {mobileNumber && !isValidMobileNumber(mobileNumber) && (
                      <p className="text-xs text-destructive">Enter a valid 10-digit mobile number</p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSendOtp}
                    disabled={!isValidMobileNumber(mobileNumber) || isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                    ) : (
                      <>Send OTP <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-center block">Enter 6-digit OTP</Label>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || isVerifyingOtp}
                  >
                    {isVerifyingOtp ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                    ) : (
                      <>Verify & Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSendOtp}
                      disabled={cooldownSeconds > 0 || isSendingOtp}
                    >
                      {cooldownSeconds > 0 ? (
                        <>Resend in {cooldownSeconds}s</>
                      ) : (
                        <>Resend OTP</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Confirm Registration */}
          {step === 'register' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Ready to Register!</h2>
                <p className="text-sm text-muted-foreground">
                  Your identity is verified. Confirm your registration.
                </p>
              </div>

              {/* User info summary */}
              <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{profile?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate ml-4">{profile?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">+91 {profile?.mobile_number}</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                <span className="font-medium">Registration Fee</span>
                <Badge variant="secondary" className="text-lg">
                  {event.is_paid ? `₹${event.price}` : 'Free'}
                </Badge>
              </div>

              {event.is_paid ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    This is a paid event. Please use the full registration form.
                  </p>
                  <Link to={`/events/${eventId}`}>
                    <Button className="w-full">Go to Event Page</Button>
                  </Link>
                </div>
              ) : (
                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleQuickRegister}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registering...</>
                  ) : (
                    <>Confirm Registration <Ticket className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">You're Registered! 🎉</h2>
                <p className="text-muted-foreground">
                  Your ticket has been generated
                </p>
              </div>

              {ticketId && (
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
                  <p className="font-mono text-sm font-medium">{ticketId}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Link to="/my-events">
                  <Button className="w-full">
                    <Ticket className="w-4 h-4 mr-2" />
                    View My Tickets
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>

              {!profile?.profile_complete && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm font-medium mb-2">Complete Your Profile</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Unlock all UniVoid features by completing your profile
                  </p>
                  <Link to="/onboarding">
                    <Button variant="outline" size="sm">Complete Profile</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to full event page */}
      <p className="text-sm text-muted-foreground mt-4">
        <Link to={`/events/${eventId}`} className="hover:underline">
          View full event details →
        </Link>
      </p>
    </div>
  );
};

export default FastRegister;

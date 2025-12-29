import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEventById, checkUserRegistration } from "@/services/eventsService";
import { useRegistration } from "@/hooks/useRegistration";
import { useRealtimeCapacity } from "@/hooks/useRealtimeCapacity";
import AuthModal from "@/components/auth/AuthModal";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import DynamicRegistrationForm from "@/components/events/DynamicRegistrationForm";
import ClubMembershipCheck from "@/components/events/ClubMembershipCheck";
import { Calendar, MapPin, Users, IndianRupee, ExternalLink, Clock, Share2, CheckCircle, AlertCircle, Upload, Eye, Loader2 } from "lucide-react";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Club membership state
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);

  const handlePriceChange = useCallback((price: number, clubId: string | null, memId: string | null) => {
    setSelectedPrice(price);
    setSelectedClubId(clubId);
    setMembershipId(memId);
  }, []);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: existingRegistration } = useQuery({
    queryKey: ["registration", eventId, user?.id],
    queryFn: () => checkUserRegistration(eventId!, user!.id),
    enabled: !!eventId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Real-time capacity updates
  const { 
    registrationsCount, 
    maxCapacity, 
    isFull, 
    spotsRemaining 
  } = useRealtimeCapacity(eventId);

  // Robust registration with debouncing and error handling
  const { 
    register, 
    isSubmitting, 
    isUploading 
  } = useRegistration({
    eventId: eventId!,
    userId: user?.id || '',
    eventTitle: event?.title,
    isPaidEvent: event?.is_paid,
    onSuccess: () => {
      setIsRegisterOpen(false);
      setPaymentScreenshot(null);
      setAgreedToTerms(false);
    },
  });

  const handleRegister = useCallback(async (customData: Record<string, unknown>) => {
    if (!user || !event) return;

    // Include club membership info in custom_data
    const enhancedCustomData = {
      ...customData,
      ...(selectedClubId && {
        _club_member: true,
        _club_id: selectedClubId,
        _membership_id: membershipId,
        _applied_price: selectedPrice,
      }),
    };

    await register(enhancedCustomData, paymentScreenshot);
  }, [user, event, selectedClubId, membershipId, selectedPrice, register, paymentScreenshot]);

  const handleShare = async () => {
    try {
      await navigator.share({ title: event?.title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!" });
    }
  };

  const isEventPast = event ? isPast(new Date(event.start_date)) : false;
  // Use real-time capacity, fallback to event data
  const effectiveRegistrations = registrationsCount || event?.registrations_count || 0;
  const effectiveCapacity = maxCapacity !== null ? maxCapacity : event?.max_capacity;
  const isFullNow = effectiveCapacity ? effectiveRegistrations >= effectiveCapacity : isFull;

  if (eventLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-video rounded-3xl" />
            <Skeleton className="h-10 w-3/4" />
          </div>
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link to="/events"><Button>Back to Events</Button></Link>
      </div>
    );
  }

  // Determine the price to display
  const displayPrice = selectedPrice !== null ? selectedPrice : event.price;

  // Club membership section for paid events
  const clubSection = event.is_paid ? (
    <ClubMembershipCheck
      eventId={eventId!}
      standardPrice={event.price}
      onPriceChange={handlePriceChange}
    />
  ) : null;

  // Payment section to pass to DynamicRegistrationForm
  const paymentSection = event.is_paid ? (
    <div className="space-y-4 p-4 bg-muted rounded-xl">
      <p className="font-medium">Payment Instructions</p>
      <p className="text-sm text-muted-foreground">Pay ₹{displayPrice} using UPI, then upload screenshot.</p>
      {event.upi_qr_url && (
        <div className="bg-white p-4 rounded-xl w-fit mx-auto">
          <img src={event.upi_qr_url} alt="UPI QR" className="w-48 h-48 object-contain" loading="lazy" />
        </div>
      )}
      {event.upi_vpa && <p className="text-center text-sm">UPI ID: <code className="bg-background px-2 py-1 rounded">{event.upi_vpa}</code></p>}
      <div className="space-y-2">
        <Label>Upload Payment Screenshot *</Label>
        <div className="border-2 border-dashed rounded-xl p-4 text-center">
          <Input type="file" accept="image/*" onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)} className="hidden" id="payment-screenshot" />
          <label htmlFor="payment-screenshot" className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{paymentScreenshot ? paymentScreenshot.name : "Click to upload"}</span>
          </label>
        </div>
      </div>
    </div>
  ) : null;

  // Terms section to pass to DynamicRegistrationForm
  const termsSection = event.terms_conditions ? (
    <div className="flex items-start gap-2">
      <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(c === true)} />
      <label htmlFor="terms" className="text-sm text-muted-foreground">I agree to the event terms and conditions</label>
    </div>
  ) : null;

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <PageBreadcrumb 
        items={[
          { label: "Events", href: "/events" },
          { label: event.title }
        ]} 
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Flyer */}
          <div className="relative rounded-3xl overflow-hidden bg-muted">
            {event.flyer_url ? (
              <img src={event.flyer_url} alt={event.title} className="w-full aspect-video object-cover" loading="lazy" />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                <Calendar className="w-24 h-24 text-primary/50" />
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge>{event.category}</Badge>
              <Badge variant="outline" className="bg-background/80 backdrop-blur">{event.event_type}</Badge>
            </div>
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="gap-1"><Eye className="w-3 h-3" />{event.views_count} views</Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="font-display text-2xl md:text-3xl font-bold">{event.title}</h1>
            <Button variant="outline" size="icon" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
          </div>

          {event.description && (
            <Card>
              <CardHeader><CardTitle>About this Event</CardTitle></CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none" 
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(event.description, {
                      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre'],
                      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
                      ALLOW_DATA_ATTR: false
                    })
                  }} 
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="text-2xl font-bold flex items-center">
                  {event.is_paid ? (<><IndianRupee className="w-5 h-5" />{event.price}</>) : (<Badge variant="secondary" className="text-lg">Free</Badge>)}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{format(new Date(event.start_date), "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(event.start_date), "h:mm a")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
                <div>
                  {event.is_location_decided ? (
                    <>
                      <p className="font-medium">{event.venue_name}</p>
                      <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                      {event.maps_link && (
                        <a href={event.maps_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline">
                          Open in Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Location TBA</p>
                  )}
                </div>
              </div>

              {effectiveCapacity && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{effectiveRegistrations} registered</span>
                      <span>{effectiveCapacity} spots</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isFullNow ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min((effectiveRegistrations / effectiveCapacity) * 100, 100)}%` }} />
                    </div>
                    {spotsRemaining !== null && spotsRemaining <= 10 && spotsRemaining > 0 && (
                      <p className="text-xs text-destructive mt-1">Only {spotsRemaining} spots left!</p>
                    )}
                  </div>
                </div>
              )}

              {existingRegistration && (
                <div className={`p-3 rounded-xl flex items-center gap-2 ${
                  existingRegistration.payment_status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : existingRegistration.payment_status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                }`}>
                  {existingRegistration.payment_status === "approved" ? (<><CheckCircle className="w-5 h-5" /><span>You're registered!</span></>) 
                  : existingRegistration.payment_status === "rejected" ? (<><AlertCircle className="w-5 h-5" /><span>Registration rejected</span></>)
                  : (<><Clock className="w-5 h-5" /><span>Payment pending</span></>)}
                </div>
              )}

              {!existingRegistration && (
                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-full text-lg py-6" disabled={isEventPast || isFullNow || !user || isSubmitting} onClick={() => !user && setShowAuthModal(true)}>
                      {!user ? "Login to Register" : isEventPast ? "Event Ended" : isFullNow ? "Event Full" : "Register Now"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Register for {event.title}</DialogTitle>
                      <DialogDescription>
                        {event.is_paid ? `Pay ₹${displayPrice} and complete the form` : "Complete your registration"}
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="py-4 space-y-4">
                        {/* Club membership selection for paid events */}
                        {clubSection}
                        
                        <DynamicRegistrationForm
                          eventId={eventId!}
                          onSubmit={handleRegister}
                          isSubmitting={isSubmitting || isUploading}
                          isPaidEvent={event.is_paid}
                          paymentSection={paymentSection}
                          termsSection={termsSection}
                          submitDisabled={(event.is_paid && !paymentScreenshot) || (!!event.terms_conditions && !agreedToTerms)}
                          submitLabel={isSubmitting ? "Registering..." : (event.is_paid ? "Submit Registration" : "Confirm Registration")}
                        />
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;

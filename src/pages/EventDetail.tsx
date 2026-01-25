import { useState, useCallback, useMemo } from "react";
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
import { fetchEventFormFields } from "@/services/eventFormService";
import { useRegistration } from "@/hooks/useRegistration";
import { useRealtimeCapacity } from "@/hooks/useRealtimeCapacity";
import AuthModal from "@/components/auth/AuthModal";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import SEOHead from "@/components/common/SEOHead";
import DynamicRegistrationForm from "@/components/events/DynamicRegistrationForm";
import ClubMembershipCheck from "@/components/events/ClubMembershipCheck";
import QuickRegisterButton from "@/components/events/QuickRegisterButton";
import UpsellScreen from "@/components/events/UpsellScreen";
import { 
  fetchEventUpsells, 
  fetchUpsellSettings,
  type SelectedUpsell,
  calculateTotalWithUpsells,
} from "@/services/upsellService";
import { getOrganizerProfileByUserId, type OrganizerProfile } from "@/services/organizerService";
import { Calendar, MapPin, Users, IndianRupee, ExternalLink, Clock, Share2, CheckCircle, AlertCircle, Upload, Eye, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Upsell flow state
  const [bookingStep, setBookingStep] = useState<"form" | "upsells" | "payment">("form");
  const [groupSize, setGroupSize] = useState(1);
  const [selectedUpsells, setSelectedUpsells] = useState<SelectedUpsell[]>([]);
  const [hasSeenUpsells, setHasSeenUpsells] = useState(false);
  
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

  // Fetch organizer profile for this event
  const { data: organizer } = useQuery({
    queryKey: ["organizer-profile", event?.organizer_id],
    queryFn: () => getOrganizerProfileByUserId(event!.organizer_id),
    enabled: !!event?.organizer_id,
    staleTime: 10 * 60 * 1000,
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

  // Fetch upsell settings and upsells
  const { data: upsellSettings } = useQuery({
    queryKey: ["upsell-settings", eventId],
    queryFn: () => fetchUpsellSettings(eventId!),
    enabled: !!eventId && !!event?.is_paid,
  });

  const { data: upsells = [] } = useQuery({
    queryKey: ["event-upsells", eventId],
    queryFn: () => fetchEventUpsells(eventId!),
    enabled: !!eventId && !!event?.is_paid && !!upsellSettings?.upsell_enabled,
  });

  // Fetch custom form fields to determine Quick Register availability
  const { data: customFormFields = [] } = useQuery({
    queryKey: ["event-form-fields", eventId],
    queryFn: () => fetchEventFormFields(eventId!),
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000,
  });

  // Quick Register is only available if NO custom fields exist
  const hasCustomFields = customFormFields.length > 0;
  const canShowQuickRegister = !hasCustomFields && (event as any)?.enable_quick_register !== false;

  // Calculate final price with upsells
  const groupOffers = useMemo(() => 
    upsells.filter(u => u.upsell_type === "group_offer"),
    [upsells]
  );

  const priceCalculation = useMemo(() => {
    const basePrice = selectedPrice !== null ? selectedPrice : (event?.price || 0);
    return calculateTotalWithUpsells(basePrice, groupSize, selectedUpsells, groupOffers);
  }, [selectedPrice, event?.price, groupSize, selectedUpsells, groupOffers]);

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
      setBookingStep("form");
      setSelectedUpsells([]);
      setGroupSize(1);
      setHasSeenUpsells(false);
    },
  });

  const handleRegister = useCallback(async (customData: Record<string, unknown>) => {
    if (!user || !event) return;

    // If upsells enabled and not yet seen, show upsell screen
    if (event.is_paid && upsellSettings?.upsell_enabled && upsells.length > 0 && !hasSeenUpsells) {
      setBookingStep("upsells");
      setHasSeenUpsells(true);
      return;
    }

    // Include club membership + upsell info in custom_data
    const enhancedCustomData = {
      ...customData,
      ...(selectedClubId && {
        _club_member: true,
        _club_id: selectedClubId,
        _membership_id: membershipId,
        _applied_price: selectedPrice,
      }),
      _group_size: groupSize,
      _base_amount: priceCalculation.baseTotal,
      _addons_amount: priceCalculation.addonsTotal,
      _total_amount: priceCalculation.finalTotal,
      _selected_addons: selectedUpsells.map(u => ({
        name: u.upsell.name,
        quantity: u.quantity,
        price: u.totalPrice,
      })),
    };

    await register(enhancedCustomData, paymentScreenshot, groupSize, groupSize > 1);
  }, [user, event, selectedClubId, membershipId, selectedPrice, register, paymentScreenshot, upsellSettings, upsells, hasSeenUpsells, groupSize, priceCalculation, selectedUpsells]);

  const handleUpsellContinue = () => {
    setBookingStep("payment");
  };

  const handleUpsellSkip = () => {
    setSelectedUpsells([]);
    setGroupSize(1);
    setBookingStep("payment");
  };

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
      <div className="w-full max-w-full px-4 py-6">
        <div className="container mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video rounded-3xl" />
              <Skeleton className="h-10 w-3/4" />
            </div>
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full max-w-full px-4 py-20 text-center">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Link to="/events"><Button>Back to Events</Button></Link>
        </div>
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

  // SEO structured data for the event
  const eventStructuredData = {
    "@type": "Event",
    name: event.title,
    description: event.description ? DOMPurify.sanitize(event.description, { ALLOWED_TAGS: [] }).substring(0, 300) : `Join ${event.title} - ${event.category} event`,
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: event.is_location_decided ? {
      "@type": "Place",
      name: event.venue_name || "Venue TBA",
      address: event.venue_address || "",
    } : {
      "@type": "VirtualLocation",
      name: "Location to be announced",
    },
    image: event.flyer_url || "https://univoid.tech/images/univoid-og.jpg",
    organizer: organizer ? {
      "@type": "Organization",
      name: organizer.name,
      url: organizer.website_url || `https://univoid.tech/o/${organizer.slug}`,
    } : {
      "@type": "Organization",
      name: "UniVoid",
      url: "https://univoid.tech",
    },
    offers: event.is_paid ? {
      "@type": "Offer",
      price: event.price,
      priceCurrency: "INR",
      availability: isFullNow ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    } : {
      "@type": "Offer",
      price: 0,
      priceCurrency: "INR",
      availability: isFullNow ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  const seoDescription = event.description 
    ? DOMPurify.sanitize(event.description, { ALLOWED_TAGS: [] }).substring(0, 155) 
    : `${event.title} - ${event.category} event on ${format(new Date(event.start_date), "MMMM d, yyyy")}. ${event.is_paid ? `Entry: ₹${event.price}` : "Free entry"}.`;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <SEOHead
        title={event.title}
        description={seoDescription}
        image={event.flyer_url}
        url={`/events/${eventId}`}
        type="event"
        structuredData={eventStructuredData}
        keywords={[event.category, event.event_type, "college event", "campus event", "student event"]}
      />
      <div className="container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-6xl">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <PageBreadcrumb 
        items={[
          { label: "Events", href: "/events" },
          { label: event.title }
        ]} 
      />

      {/* Desktop: Flyer left (fixed width), Info right. Mobile: Stacked */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left column: Flyer - Fixed 4:5 container on desktop */}
        <div className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 space-y-6">
          {/* Flyer - STRICT 4:5 aspect ratio container */}
          <div 
            className="relative rounded-3xl overflow-hidden bg-muted w-full"
            style={{ aspectRatio: '4/5' }}
          >
            {event.flyer_url ? (
              <img 
                src={event.flyer_url} 
                alt={event.title} 
                className="w-full h-full object-cover" 
                loading="lazy" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                <Calendar className="w-24 h-24 text-primary/50" />
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
              <Badge>{event.category}</Badge>
              <Badge variant="outline" className="bg-background/80 backdrop-blur">{event.event_type}</Badge>
            </div>
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="gap-1"><Eye className="w-3 h-3" />{event.views_count} views</Badge>
            </div>
          </div>

          {/* Title and Share - Mobile shows here, Desktop in sidebar */}
          <div className="lg:hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="font-display text-2xl md:text-3xl font-bold">{event.title}</h1>
              <Button variant="outline" size="icon" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* About section - Desktop shows under flyer */}
          <div className="hidden lg:block">
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
        </div>

        {/* Right column: Info Card + About (mobile) */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Title - Desktop only */}
          <div className="hidden lg:flex flex-wrap items-start justify-between gap-4">
            <h1 className="font-display text-2xl md:text-3xl font-bold">{event.title}</h1>
            <Button variant="outline" size="icon" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
          </div>

          {/* About section - Mobile shows here */}
          <div className="lg:hidden">
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

          {/* Sidebar Info Card */}
          <Card className="lg:sticky lg:top-20">
            <CardContent className="p-6 space-y-4">
              {/* Organizer Info */}
              {organizer && (
                <Link 
                  to={`/o/${organizer.slug}`}
                  className="flex items-center gap-3 p-3 -mx-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-10 h-10 border">
                    <AvatarImage src={organizer.logo_url || undefined} alt={organizer.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {organizer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate">{organizer.name}</span>
                      {organizer.is_verified && (
                        <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Organizer</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}

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
                  {/* City & State */}
                  {(event as any).city && (event as any).state && (
                    <p className="font-medium">{(event as any).city}, {(event as any).state}</p>
                  )}
                  {event.is_location_decided ? (
                    <>
                      <p className={`${(event as any).city ? 'text-sm text-muted-foreground' : 'font-medium'}`}>{event.venue_name}</p>
                      <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                      {event.maps_link && (
                        <a href={event.maps_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline">
                          Open in Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </>
                  ) : !((event as any).city && (event as any).state) && (
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
                <div className="space-y-3">
                  {/* Primary CTA: Quick Register - only show if NO custom fields exist */}
                  {!isEventPast && !isFullNow && canShowQuickRegister && (
                    <QuickRegisterButton 
                      eventId={eventId!} 
                      isPast={isEventPast} 
                      isFull={isFullNow}
                      variant="primary"
                      className="w-full"
                    />
                  )}

                  {/* Secondary CTA: Login/Register via dialog */}
                  <Dialog open={isRegisterOpen} onOpenChange={(open) => {
                    setIsRegisterOpen(open);
                    if (!open) {
                      // Reset booking flow when closing
                      setBookingStep("form");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant={canShowQuickRegister ? "outline" : "default"}
                        className="w-full rounded-full" 
                        disabled={isEventPast || isFullNow || isSubmitting} 
                        onClick={() => !user && setShowAuthModal(true)}
                      >
                        {!user ? "Already have an account? Login" : isEventPast ? "Event Ended" : isFullNow ? "Event Full" : hasCustomFields ? "Register Now" : "Register with full details"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>
                          {bookingStep === "upsells" ? "Enhance Your Experience" : `Register for ${event.title}`}
                        </DialogTitle>
                        <DialogDescription>
                          {bookingStep === "upsells" 
                            ? "Add extras to your booking" 
                            : bookingStep === "payment"
                            ? `Total: ₹${priceCalculation.finalTotal}`
                            : event.is_paid 
                            ? `Pay ₹${displayPrice} and complete the form` 
                            : "Complete your registration"}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="py-4 space-y-4">
                          {/* Step 1: Form */}
                          {bookingStep === "form" && (
                            <>
                              {/* Club membership selection for paid events */}
                              {clubSection}
                              
                              <DynamicRegistrationForm
                                eventId={eventId!}
                                onSubmit={handleRegister}
                                isSubmitting={isSubmitting || isUploading}
                                isPaidEvent={event.is_paid}
                                paymentSection={!upsellSettings?.upsell_enabled ? paymentSection : undefined}
                                termsSection={!upsellSettings?.upsell_enabled ? termsSection : undefined}
                                submitDisabled={!upsellSettings?.upsell_enabled && ((event.is_paid && !paymentScreenshot) || (!!event.terms_conditions && !agreedToTerms))}
                                submitLabel={
                                  isSubmitting 
                                    ? "Processing..." 
                                    : upsellSettings?.upsell_enabled && upsells.length > 0
                                    ? "Continue"
                                    : event.is_paid 
                                    ? "Submit Registration" 
                                    : "Confirm Registration"
                                }
                              />
                            </>
                          )}

                          {/* Step 2: Upsells */}
                          {bookingStep === "upsells" && (
                            <UpsellScreen
                              upsells={upsells}
                              basePrice={selectedPrice !== null ? selectedPrice : (event.price || 0)}
                              groupSize={groupSize}
                              onGroupSizeChange={setGroupSize}
                              selectedUpsells={selectedUpsells}
                              onUpsellsChange={setSelectedUpsells}
                              onContinue={handleUpsellContinue}
                              onSkip={handleUpsellSkip}
                            />
                          )}

                          {/* Step 3: Payment (after upsells) */}
                          {bookingStep === "payment" && (
                            <>
                              {/* Price summary with all discounts clearly shown */}
                              <Card className="bg-muted/50">
                                <CardContent className="py-4 space-y-2">
                                  {/* Original price if club discount applied */}
                                  {selectedPrice !== null && selectedPrice < event.price && (
                                    <div className="flex justify-between text-sm">
                                      <span>Original Price ({groupSize} × ₹{event.price})</span>
                                      <span className="line-through text-muted-foreground">₹{groupSize * event.price}</span>
                                    </div>
                                  )}
                                  
                                  {/* Club member discount */}
                                  {selectedPrice !== null && selectedPrice < event.price && (
                                    <div className="flex justify-between text-sm text-green-600 font-medium">
                                      <span>🎉 Club Member Discount</span>
                                      <span>-₹{(event.price - selectedPrice) * groupSize}</span>
                                    </div>
                                  )}
                                  
                                  {/* Tickets after discount */}
                                  <div className="flex justify-between text-sm">
                                    <span>Tickets ({groupSize} × ₹{selectedPrice !== null ? selectedPrice : event.price})</span>
                                    <span>₹{priceCalculation.baseTotal}</span>
                                  </div>
                                  
                                  {/* Group discount */}
                                  {priceCalculation.discounts > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                      <span>Group Discount</span>
                                      <span>-₹{priceCalculation.discounts}</span>
                                    </div>
                                  )}
                                  
                                  {/* Add-ons */}
                                  {priceCalculation.addonsTotal > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span>Add-ons</span>
                                      <span>+₹{priceCalculation.addonsTotal}</span>
                                    </div>
                                  )}
                                  
                                  {/* Final total */}
                                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>Total Payable</span>
                                    <span className="text-primary">₹{priceCalculation.finalTotal}</span>
                                  </div>
                                </CardContent>
                              </Card>

                              {paymentSection}
                              {termsSection}

                              <Button
                                onClick={() => handleRegister({})}
                                disabled={isSubmitting || isUploading || (event.is_paid && !paymentScreenshot) || (!!event.terms_conditions && !agreedToTerms)}
                                className="w-full"
                              >
                                {isSubmitting ? "Submitting..." : "Complete Registration"}
                              </Button>
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
};

export default EventDetail;

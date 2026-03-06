import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEventById, checkUserRegistration } from "@/services/eventsService";
import { fetchEventFormFields } from "@/services/eventFormService";
import { useRegistration } from "@/hooks/useRegistration";
import { useRealtimeCapacity } from "@/hooks/useRealtimeCapacity";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import AuthModal from "@/components/auth/AuthModal";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import SEOHead from "@/components/common/SEOHead";
import DynamicRegistrationForm from "@/components/events/DynamicRegistrationForm";
import ClubMembershipCheck from "@/components/events/ClubMembershipCheck";
import QuickRegisterButton from "@/components/events/QuickRegisterButton";
import UpsellScreen from "@/components/events/UpsellScreen";
import TicketCategorySelector from "@/components/events/TicketCategorySelector";
import { fetchTicketCategories, saveTicketAttendees, type TicketCategorySelection } from "@/services/ticketCategoryService";
import { supabase } from "@/integrations/supabase/client";
import { 
  fetchEventUpsells, 
  fetchUpsellSettings,
  type SelectedUpsell,
  calculateTotalWithUpsells,
} from "@/services/upsellService";
import { getOrganizerProfileByUserId, type OrganizerProfile } from "@/services/organizerService";
import { toDisplayUrl } from "@/lib/storageProxy";
import { formatRichText } from "@/lib/formatRichText";
import { Calendar, MapPin, Users, IndianRupee, ExternalLink, Clock, Share2, CheckCircle, AlertCircle, Upload, Eye, BadgeCheck, ChevronDown, FileText, Image } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  
  // Upsell flow state
  const [bookingStep, setBookingStep] = useState<"form" | "upsells" | "payment">("form");
  const [groupSize, setGroupSize] = useState(1);
  const [selectedUpsells, setSelectedUpsells] = useState<SelectedUpsell[]>([]);
  const [hasSeenUpsells, setHasSeenUpsells] = useState(false);
  
  // Ticket category selections
  const [categorySelections, setCategorySelections] = useState<TicketCategorySelection[]>([]);
  
  // Club membership state
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  
  // Description expand state (WordPress-style read more)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  
  // Refs for scroll capture system (BookMyShow-style)
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const [isDesktopView, setIsDesktopView] = useState(false);

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkDesktop = () => setIsDesktopView(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Lock body scroll on desktop using the dedicated hook
  useBodyScrollLock(isDesktopView);

  // Native scroll - no JS interception, browser handles all scroll physics naturally

  const handlePriceChange = useCallback((price: number, clubId: string | null, memId: string | null) => {
    setSelectedPrice(price);
    setSelectedClubId(clubId);
    setMembershipId(memId);
  }, []);

  // Fetch event by ID or slug
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });

  // Redirect from ID to slug for SEO (canonical URLs)
  useEffect(() => {
    if (event?.slug && eventId !== event.slug) {
      // Check if current URL uses ID instead of slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId || '');
      if (isUUID) {
        navigate(`/events/${event.slug}`, { replace: true });
      }
    }
  }, [event?.slug, eventId, navigate]);

  // Fetch organizer profile for this event
  const { data: organizer } = useQuery({
    queryKey: ["organizer-profile", event?.organizer_id],
    queryFn: () => getOrganizerProfileByUserId(event!.organizer_id),
    enabled: !!event?.organizer_id,
    staleTime: 10 * 60 * 1000,
  });

  // Check user registration - use event.id (actual UUID) for DB queries
  const { data: existingRegistration } = useQuery({
    queryKey: ["registration", event?.id, user?.id],
    queryFn: () => checkUserRegistration(event!.id, user!.id),
    enabled: !!event?.id && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Real-time capacity updates - use event.id for DB subscriptions
  const { 
    registrationsCount, 
    maxCapacity, 
    isFull, 
    spotsRemaining 
  } = useRealtimeCapacity(event?.id);

  // Fetch upsell settings and upsells - use event.id for DB queries
  const { data: upsellSettings } = useQuery({
    queryKey: ["upsell-settings", event?.id],
    queryFn: () => fetchUpsellSettings(event!.id),
    enabled: !!event?.id && !!event?.is_paid,
  });

  const { data: upsells = [] } = useQuery({
    queryKey: ["event-upsells", event?.id],
    queryFn: () => fetchEventUpsells(event!.id),
    enabled: !!event?.id && !!event?.is_paid && !!upsellSettings?.upsell_enabled,
  });

  // Fetch custom form fields to determine Quick Register availability
  const { data: customFormFields = [] } = useQuery({
    queryKey: ["event-form-fields", event?.id],
    queryFn: () => fetchEventFormFields(event!.id),
    enabled: !!event?.id,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch ticket categories for this event
  const { data: ticketCategories = [] } = useQuery({
    queryKey: ["ticket-categories", event?.id],
    queryFn: () => fetchTicketCategories(event!.id),
    enabled: !!event?.id,
    staleTime: 10 * 60 * 1000,
  });

  // Quick Register is only available if NO custom fields exist
  const hasCustomFields = customFormFields.length > 0;
  const hasTicketCategories = ticketCategories.length > 0;
  const canShowQuickRegister = !hasCustomFields && !hasTicketCategories && (event as any)?.enable_quick_register !== false;

  // Calculate final price with upsells
  const groupOffers = useMemo(() => 
    upsells.filter(u => u.upsell_type === "group_offer"),
    [upsells]
  );

  const totalCategoryTickets = categorySelections.reduce((sum, s) => sum + s.quantity, 0);
  const totalCategoryPrice = categorySelections.reduce((sum, s) => sum + s.category.price * s.quantity, 0);

  const priceCalculation = useMemo(() => {
    if (hasTicketCategories && categorySelections.length > 0) {
      // Use ticket category total as the base price, with quantity=1 since it's already summed
      return calculateTotalWithUpsells(totalCategoryPrice, 1, selectedUpsells, groupOffers);
    }
    const basePrice = selectedPrice !== null ? selectedPrice : (event?.price || 0);
    return calculateTotalWithUpsells(basePrice, groupSize, selectedUpsells, groupOffers);
  }, [selectedPrice, event?.price, groupSize, selectedUpsells, groupOffers, hasTicketCategories, categorySelections, totalCategoryPrice]);

  // Robust registration with debouncing and error handling - use event.id for DB operations
  const { 
    register, 
    isSubmitting, 
    isUploading 
  } = useRegistration({
    eventId: event?.id || '',
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
      setPaymentMethod("razorpay");
    },
  });

  // Razorpay payment hook
  const { initiatePayment: initiateRazorpay, isProcessing: isRazorpayProcessing } = useRazorpay({
    eventTitle: event?.title || 'Event',
    onSuccess: () => {
      setIsRegisterOpen(false);
      setPaymentScreenshot(null);
      setAgreedToTerms(false);
      setBookingStep("form");
      setSelectedUpsells([]);
      setGroupSize(1);
      setHasSeenUpsells(false);
      setPaymentMethod("razorpay");
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

    // Include club membership + upsell + category info in custom_data
    
    const enhancedCustomData = {
      ...customData,
      ...(selectedClubId && {
        _club_member: true,
        _club_id: selectedClubId,
        _membership_id: membershipId,
        _applied_price: selectedPrice,
      }),
      _group_size: hasTicketCategories ? totalCategoryTickets : groupSize,
      _base_amount: hasTicketCategories ? totalCategoryPrice : priceCalculation.baseTotal,
      _addons_amount: priceCalculation.addonsTotal,
      _total_amount: hasTicketCategories ? totalCategoryPrice + priceCalculation.addonsTotal : priceCalculation.finalTotal,
      _selected_addons: selectedUpsells.map(u => ({
        name: u.upsell.name,
        quantity: u.quantity,
        price: u.totalPrice,
      })),
      ...(hasTicketCategories && {
        _ticket_categories: categorySelections.map(s => ({
          category_name: s.category.name,
          category_id: s.category.id,
          quantity: s.quantity,
          unit_price: s.category.price,
          total: s.category.price * s.quantity,
          attendees: s.attendees,
        })),
      }),
    };

    const effectiveGroupSize = hasTicketCategories ? totalCategoryTickets : groupSize;
    
    // For Razorpay: register first (as pending), then initiate payment
    const isRazorpayPayment = event.is_paid && paymentMethod === 'razorpay';
    const result = await register(
      enhancedCustomData, 
      isRazorpayPayment ? null : paymentScreenshot, // No screenshot for Razorpay
      effectiveGroupSize, 
      effectiveGroupSize > 1,
      isRazorpayPayment, // Skip success callback for Razorpay - we handle it after payment
    );
    
    const shouldStartRazorpay =
      isRazorpayPayment &&
      result?.success &&
      !!result.registration_id &&
      (!result.already_registered || result.payment_status === 'pending');

    // For new and pending registrations, initiate Razorpay checkout
    if (shouldStartRazorpay) {
      const totalAmount = hasTicketCategories
        ? totalCategoryPrice + priceCalculation.addonsTotal 
        : priceCalculation.finalTotal;
      
      // Get user info for prefill
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, mobile_number')
        .eq('id', user.id)
        .maybeSingle();
      
      await initiateRazorpay(
        totalAmount,
        event.id,
        user.id,
        result.registration_id,
        {
          name: profile?.full_name || '',
          email: profile?.email || user.email || '',
          contact: profile?.mobile_number || '',
        },
      );
    }
    
    // Save attendee details for ALL ticket categories (mandatory from 1st ticket)
    if (result?.success && result.registration_id && hasTicketCategories) {
      const allAttendees = categorySelections.flatMap(s =>
        s.attendees
          .filter(a => a.name && a.email && a.mobile)
          .map(a => ({
            ticket_category_id: s.category.id,
            attendee_name: a.name,
            attendee_email: a.email,
            attendee_mobile: a.mobile,
          }))
      );
      if (allAttendees.length > 0) {
        try {
          await saveTicketAttendees(result.registration_id, allAttendees);
          console.log("✅ Attendee details saved, sending guest emails...");
          
          // Now explicitly invoke send-ticket-email for guest attendees
          // The DB trigger already sent the primary user's email, so use attendeesOnly mode
          const { data: ticketData } = await supabase
            .from('event_tickets')
            .select('id, qr_code')
            .eq('registration_id', result.registration_id)
            .maybeSingle();
          
          if (ticketData) {
            await supabase.functions.invoke('send-ticket-email', {
              body: {
                ticketId: ticketData.id,
                registrationId: result.registration_id,
                eventId: event.id,
                userId: user.id,
                qrCode: ticketData.qr_code,
                attendeesOnly: true,
              },
            });
          }
        } catch (e) {
          console.error("Failed to save attendee details or send guest emails:", e);
        }
      }
    }
  }, [user, event, selectedClubId, membershipId, selectedPrice, register, paymentScreenshot, paymentMethod, upsellSettings, upsells, hasSeenUpsells, groupSize, priceCalculation, selectedUpsells, categorySelections, hasTicketCategories, initiateRazorpay]);

  const handleUpsellContinue = () => {
    setBookingStep("payment");
  };

  const handleUpsellSkip = () => {
    setSelectedUpsells([]);
    setGroupSize(1);
    setBookingStep("payment");
  };

  const handleShare = async () => {
    // Use slug-based URL for professional sharing
    const eventSlug = event?.slug || eventId;
    const shareUrl = `https://univoid.tech/events/${eventSlug}`;
    
    try {
      await navigator.share({ title: event?.title, url: shareUrl });
    } catch {
      navigator.clipboard.writeText(shareUrl);
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

  // Determine the price to display — prefer ticket category range over base price
  const categoryMinPrice = ticketCategories.length > 0 
    ? Math.min(...ticketCategories.map(c => c.price)) 
    : null;
  const categoryMaxPrice = ticketCategories.length > 0 
    ? Math.max(...ticketCategories.map(c => c.price)) 
    : null;
  const hasMultiplePrices = categoryMinPrice !== null && categoryMaxPrice !== null && categoryMinPrice !== categoryMaxPrice;
  const displayPrice = selectedPrice !== null ? selectedPrice : (categoryMinPrice ?? event.price);

  // Club membership section for paid events
  const clubSection = event.is_paid ? (
    <ClubMembershipCheck
      eventId={event.id}
      standardPrice={event.price}
      onPriceChange={handlePriceChange}
    />
  ) : null;

  // Payment section to pass to DynamicRegistrationForm
  const paymentSection = event.is_paid ? (
    <div className="space-y-4 p-4 bg-muted rounded-xl">
      <p className="font-medium">Payment Method</p>
      
      {/* Payment method toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPaymentMethod("razorpay")}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
            paymentMethod === "razorpay" 
              ? "border-primary bg-primary/10 text-primary" 
              : "border-border bg-background text-muted-foreground hover:border-primary/50"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-sm font-medium">Pay Online</span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("screenshot")}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
            paymentMethod === "screenshot" 
              ? "border-primary bg-primary/10 text-primary" 
              : "border-border bg-background text-muted-foreground hover:border-primary/50"
          }`}
        >
          <Image className="w-4 h-4" />
          <span className="text-sm font-medium">UPI Screenshot</span>
        </button>
      </div>

      {paymentMethod === "razorpay" ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Pay ₹{displayPrice} securely via Razorpay. Your ticket will be confirmed instantly.
          </p>
          {isRazorpayProcessing && (
            <p className="text-xs text-primary animate-pulse">Processing payment...</p>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Pay ₹{displayPrice} using UPI, then upload screenshot.</p>
          {event.upi_qr_url && (
            <div className="bg-background p-4 rounded-xl w-fit mx-auto">
              <img src={toDisplayUrl(event.upi_qr_url, { forceImage: true }) || undefined} alt="UPI QR" className="w-48 h-48 object-contain" loading="lazy" />
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
        </>
      )}
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
      price: categoryMinPrice ?? event.price,
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
    : `${event.title} - ${event.category} event on ${format(new Date(event.start_date), "MMMM d, yyyy")}. ${event.is_paid ? `Entry: ₹${categoryMinPrice ?? event.price}` : "Free entry"}.`;

  // Use slug for canonical URL
  const eventSlug = event.slug || eventId;

  return (
    <div className="w-full max-w-full">
      <SEOHead
        title={event.title}
        description={seoDescription}
        image={event.flyer_url || undefined}
        url={`/events/${eventSlug}`}
        type="event"
        structuredData={eventStructuredData}
        keywords={[event.category, event.event_type, "college event", "campus event", "student event"]}
      />
      {/* Mobile: Regular scrollable layout */}
      <div className="lg:hidden">
        <div className="container mx-auto px-5 pt-3 pb-24 max-w-6xl space-y-5">
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} returnTo={`/events/${eventId}`} />
        {/* Mobile: Flyer first */}
        <div className="relative rounded-3xl overflow-hidden bg-muted w-full">
          {event.flyer_url ? (
            <img 
              src={toDisplayUrl(event.flyer_url, { forceImage: true }) || undefined} 
              alt={event.title} 
              className="w-full h-auto object-contain rounded-3xl" 
              loading="eager" 
            />
          ) : (
            <div 
              className="w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30"
              style={{ aspectRatio: '4/5' }}
            >
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

        {/* Mobile: Title and Share */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="font-display text-2xl md:text-3xl font-bold">{event.title}</h1>
          <Button variant="outline" size="icon" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
        </div>

        {/* Mobile: Registration Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="text-xl font-bold flex items-center">
                {event.is_paid ? (
                  ticketCategories.length > 0 ? (
                    hasMultiplePrices ? (
                      <span className="flex items-center gap-0.5">
                        <IndianRupee className="w-4 h-4" />{categoryMinPrice} – {categoryMaxPrice}
                      </span>
                    ) : (
                      <><IndianRupee className="w-4 h-4" />{categoryMinPrice}</>
                    )
                  ) : (
                    <><IndianRupee className="w-4 h-4" />{event.price}</>
                  )
                ) : (<Badge variant="secondary">Free</Badge>)}
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-medium">{format(new Date(event.start_date), "EEE, MMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(event.start_date), "h:mm a")}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                {(event as any).city && (event as any).state && (
                  <p className="font-medium">{(event as any).city}, {(event as any).state}</p>
                )}
                {event.is_location_decided ? (
                  <>
                    <p className={`truncate ${(event as any).city ? 'text-xs text-muted-foreground' : 'font-medium'}`}>{event.venue_name}</p>
                    {event.maps_link && (
                      <a href={event.maps_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
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
              <div className="flex items-center gap-2.5 text-sm">
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{effectiveRegistrations} registered</span>
                    <span>{effectiveCapacity} spots</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isFullNow ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min((effectiveRegistrations / effectiveCapacity) * 100, 100)}%` }} />
                  </div>
                  {spotsRemaining !== null && spotsRemaining <= 10 && spotsRemaining > 0 && (
                    <p className="text-xs text-destructive mt-1">Only {spotsRemaining} spots left!</p>
                  )}
                </div>
              </div>
            )}
            {existingRegistration && (
              <div className={`p-2.5 rounded-lg flex items-center gap-2 text-sm ${
                existingRegistration.payment_status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : existingRegistration.payment_status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              }`}>
                {existingRegistration.payment_status === "approved" ? (<><CheckCircle className="w-4 h-4" /><span>You're registered!</span></>) 
                : existingRegistration.payment_status === "rejected" ? (<><AlertCircle className="w-4 h-4" /><span>Registration rejected. You cannot re-apply.</span></>)
                : (<><Clock className="w-4 h-4" /><span>Payment pending verification</span></>)}
              </div>
            )}
            {!existingRegistration && (
              <div className="space-y-3">
                {!isEventPast && !isFullNow && canShowQuickRegister && (
                  <QuickRegisterButton eventId={event.id} isPast={isEventPast} isFull={isFullNow} variant="primary" className="w-full" />
                )}
                {/* Login button for non-authenticated users - opens auth modal only */}
                {!user && (
                  <Button variant={canShowQuickRegister ? "outline" : "default"} className="w-full rounded-full" disabled={isEventPast || isFullNow} onClick={() => setShowAuthModal(true)}>
                    Register Now
                  </Button>
                )}
                {/* Registration dialog for authenticated users only */}
                {user && (
                <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) setBookingStep("form"); }}>
                  <DialogTrigger asChild>
                    <Button variant={canShowQuickRegister ? "outline" : "default"} className="w-full rounded-full" disabled={isEventPast || isFullNow || isSubmitting}>
                      {isEventPast ? "Event Ended" : isFullNow ? "Event Full" : hasCustomFields ? "Register Now" : "Register with full details"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>{bookingStep === "upsells" ? "Enhance Your Experience" : `Register for ${event.title}`}</DialogTitle>
                      <DialogDescription>{bookingStep === "upsells" ? "Add extras to your booking" : bookingStep === "payment" ? `Total: ₹${priceCalculation.finalTotal}` : event.is_paid ? `Pay ₹${displayPrice} and complete the form` : "Complete your registration"}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="py-4 space-y-4">
                        {bookingStep === "form" && (
                          <>
                            {clubSection}
                            {hasTicketCategories && (
                              <TicketCategorySelector
                                categories={ticketCategories}
                                selections={categorySelections}
                                onChange={setCategorySelections}
                                isPaidEvent={event.is_paid}
                              />
                            )}
                            <DynamicRegistrationForm eventId={event.id} onSubmit={handleRegister} isSubmitting={isSubmitting || isUploading || isRazorpayProcessing} isPaidEvent={event.is_paid} paymentSection={!upsellSettings?.upsell_enabled ? paymentSection : undefined} termsSection={!upsellSettings?.upsell_enabled ? termsSection : undefined} submitDisabled={!upsellSettings?.upsell_enabled && ((event.is_paid && paymentMethod === 'screenshot' && !paymentScreenshot) || (!!event.terms_conditions && !agreedToTerms)) || (hasTicketCategories && (categorySelections.length === 0 || categorySelections.some(s => s.attendees.some(a => !a.name || !a.email || !a.mobile))))} submitLabel={isSubmitting || isRazorpayProcessing ? "Processing..." : upsellSettings?.upsell_enabled && upsells.length > 0 ? "Continue" : event.is_paid && paymentMethod === 'razorpay' ? "Pay & Register" : event.is_paid ? "Submit Registration" : "Confirm Registration"} />
                          </>
                        )}
                        {bookingStep === "upsells" && (
                          <UpsellScreen upsells={upsells} basePrice={hasTicketCategories ? totalCategoryPrice : (selectedPrice !== null ? selectedPrice : (event.price || 0))} groupSize={hasTicketCategories ? 1 : groupSize} onGroupSizeChange={setGroupSize} selectedUpsells={selectedUpsells} onUpsellsChange={setSelectedUpsells} onContinue={handleUpsellContinue} onSkip={handleUpsellSkip} />
                        )}
                        {bookingStep === "payment" && (
                          <>
                            <Card className="bg-muted/50">
                              <CardContent className="py-4 space-y-2">
                                {hasTicketCategories && categorySelections.length > 0 ? (
                                  <>
                                    {categorySelections.map(s => (
                                      <div key={s.category.id} className="flex justify-between text-sm">
                                        <span>{s.category.name} ({s.quantity} × ₹{s.category.price})</span>
                                        <span>₹{s.category.price * s.quantity}</span>
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  <>
                                    {selectedPrice !== null && selectedPrice < event.price && (<div className="flex justify-between text-sm"><span>Original Price ({groupSize} × ₹{event.price})</span><span className="line-through text-muted-foreground">₹{groupSize * event.price}</span></div>)}
                                    {selectedPrice !== null && selectedPrice < event.price && (<div className="flex justify-between text-sm text-green-600 font-medium"><span>🎉 Club Member Discount</span><span>-₹{(event.price - selectedPrice) * groupSize}</span></div>)}
                                    <div className="flex justify-between text-sm"><span>Tickets ({groupSize} × ₹{selectedPrice !== null ? selectedPrice : event.price})</span><span>₹{priceCalculation.baseTotal}</span></div>
                                  </>
                                )}
                                {priceCalculation.discounts > 0 && (<div className="flex justify-between text-sm text-green-600"><span>Group Discount</span><span>-₹{priceCalculation.discounts}</span></div>)}
                                {priceCalculation.addonsTotal > 0 && (<div className="flex justify-between text-sm"><span>Add-ons</span><span>+₹{priceCalculation.addonsTotal}</span></div>)}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total Payable</span><span className="text-primary">₹{priceCalculation.finalTotal}</span></div>
                              </CardContent>
                            </Card>
                            {paymentSection}
                            {termsSection}
                            <Button onClick={() => handleRegister({})} disabled={isSubmitting || isUploading || isRazorpayProcessing || (event.is_paid && paymentMethod === 'screenshot' && !paymentScreenshot) || (!!event.terms_conditions && !agreedToTerms)} className="w-full">{isSubmitting || isRazorpayProcessing ? "Processing..." : event.is_paid && paymentMethod === 'razorpay' ? "Pay & Complete" : "Complete Registration"}</Button>
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile: Organizer Card */}
        {organizer && (
          <Card>
            <CardContent className="p-4">
              <Link to={`/o/${organizer.slug}`} className="flex items-center gap-3 rounded-lg hover:bg-muted/50 transition-colors -m-1 p-1">
                <Avatar className="w-10 h-10 border">
                  <AvatarImage src={toDisplayUrl(organizer.logo_url, { forceImage: true }) || undefined} alt={organizer.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">{organizer.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium truncate text-sm">{organizer.name}</span>
                    {organizer.is_verified && (<BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />)}
                  </div>
                  <p className="text-xs text-muted-foreground">Event Organizer</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Mobile: About section - WordPress-style inline expand */}
        {event.description && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">About this Event</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div 
                className={`prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap transition-all duration-300 ${!isDescriptionExpanded ? 'line-clamp-5' : ''}`} 
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatRichText(event.description), { ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre'], ALLOWED_ATTR: ['href', 'title', 'target', 'rel'], ALLOW_DATA_ATTR: false }) }} 
              />
              <button 
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-primary text-sm font-medium mt-2 hover:underline focus:outline-none"
              >
                {isDescriptionExpanded ? 'Read less' : 'Read more'}
              </button>
            </CardContent>
          </Card>
        )}

        {/* Mobile: Terms & Conditions */}
        {event.terms_conditions && (
          <Collapsible>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-4 h-4" />Terms & Conditions</CardTitle>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatRichText(event.terms_conditions), { ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre'], ALLOWED_ATTR: ['href', 'title', 'target', 'rel'], ALLOW_DATA_ATTR: false }) }} />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
        </div>
      </div>

      {/* DESKTOP LAYOUT: Body scroll locked, left column is the only scrollable area */}
      {/* 
        BOOKMYSHOW-STYLE SCROLL:
        - Body scroll is LOCKED on desktop
        - All wheel events captured globally and forwarded to left column
        - Container fills entire viewport (no body scroll)
        - Right column stays fixed in place
      */}
      <div 
        ref={desktopContainerRef}
        className="hidden lg:flex lg:flex-row lg:gap-6 h-[calc(100vh-5rem)] container mx-auto px-10 max-w-6xl pt-3 overflow-hidden"
      >
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} returnTo={`/events/${eventId}`} />
        
        {/* Left column - THE ONLY scrollable area on desktop */}
        <div 
          ref={leftColumnRef}
          className="flex-1 overflow-y-auto pr-2 space-y-5 pb-8" 
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth'
          }}
        >
          {/* Desktop: Hero Flyer - 4:5 aspect ratio, no outer spacing */}
          <div className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/5]">
            {event.flyer_url ? (
              <img 
                src={toDisplayUrl(event.flyer_url, { forceImage: true }) || undefined} 
                alt={event.title} 
                className="w-full h-full object-cover" 
                loading="eager" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                <Calendar className="w-24 h-24 text-primary/50" />
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              <Badge>{event.category}</Badge>
              <Badge variant="outline" className="bg-background/80 backdrop-blur">{event.event_type}</Badge>
            </div>
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="gap-1"><Eye className="w-3 h-3" />{event.views_count} views</Badge>
            </div>
          </div>

          {/* Desktop: About section - WordPress-style inline expand */}
          {event.description && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">About this Event</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div 
                  className={`prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap transition-all duration-300 ${!isDescriptionExpanded ? 'line-clamp-5' : ''}`} 
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatRichText(event.description), { ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre'], ALLOWED_ATTR: ['href', 'title', 'target', 'rel'], ALLOW_DATA_ATTR: false }) }} 
                />
                <button 
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-primary text-sm font-medium mt-2 hover:underline focus:outline-none"
                >
                  {isDescriptionExpanded ? 'Read less' : 'Read more'}
                </button>
              </CardContent>
            </Card>
          )}

          {/* Desktop: Terms & Conditions */}
          {event.terms_conditions && (
            <Collapsible>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-xl py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-4 h-4" />Terms & Conditions</CardTitle>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatRichText(event.terms_conditions), { ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'pre'], ALLOWED_ATTR: ['href', 'title', 'target', 'rel'], ALLOW_DATA_ATTR: false }) }} />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </div>

        {/* Right column - Fixed position within the layout, does not scroll */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="space-y-4">
            {/* Desktop: Title */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-display text-xl xl:text-2xl font-bold leading-tight">{event.title}</h1>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
            </div>

            {/* Desktop: Registration Card - larger padding for visual weight */}
            <Card className="shadow-lg">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-2xl font-bold flex items-center text-primary">
                    {event.is_paid ? (
                      ticketCategories.length > 0 ? (
                        hasMultiplePrices ? (
                          <span className="flex items-center gap-0.5">
                            <IndianRupee className="w-5 h-5" />{categoryMinPrice} – {categoryMaxPrice}
                          </span>
                        ) : (
                          <><IndianRupee className="w-5 h-5" />{categoryMinPrice}</>
                        )
                      ) : (
                        <><IndianRupee className="w-5 h-5" />{event.price}</>
                      )
                    ) : (<Badge variant="secondary" className="text-base px-3 py-1">Free</Badge>)}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">{format(new Date(event.start_date), "EEE, MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(event.start_date), "h:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    {(event as any).city && (event as any).state && (
                      <p className="font-medium">{(event as any).city}, {(event as any).state}</p>
                    )}
                    {event.is_location_decided ? (
                      <>
                        <p className={`truncate ${(event as any).city ? 'text-xs text-muted-foreground' : 'font-medium'}`}>{event.venue_name}</p>
                        {event.maps_link && (
                          <a href={event.maps_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
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
                  <div className="flex items-center gap-2.5 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{effectiveRegistrations} registered</span>
                        <span>{effectiveCapacity} spots</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isFullNow ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min((effectiveRegistrations / effectiveCapacity) * 100, 100)}%` }} />
                      </div>
                      {spotsRemaining !== null && spotsRemaining <= 10 && spotsRemaining > 0 && (
                        <p className="text-xs text-destructive mt-1">Only {spotsRemaining} spots left!</p>
                      )}
                    </div>
                  </div>
                )}
                {existingRegistration && (
                  <div className={`p-2.5 rounded-lg flex items-center gap-2 text-sm ${
                    existingRegistration.payment_status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : existingRegistration.payment_status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                  }`}>
                    {existingRegistration.payment_status === "approved" ? (<><CheckCircle className="w-4 h-4" /><span>You're registered!</span></>) 
                    : existingRegistration.payment_status === "rejected" ? (<><AlertCircle className="w-4 h-4" /><span>Registration rejected. You cannot re-apply.</span></>)
                    : (<><Clock className="w-4 h-4" /><span>Payment pending verification</span></>)}
                  </div>
                )}
                {!existingRegistration && (
                  <div className="space-y-3">
                    {!isEventPast && !isFullNow && canShowQuickRegister && (
                      <QuickRegisterButton eventId={event.id} isPast={isEventPast} isFull={isFullNow} variant="primary" className="w-full" />
                    )}
                    {/* Login button for non-authenticated users - opens auth modal only */}
                    {!user && (
                      <Button variant={canShowQuickRegister ? "outline" : "default"} className="w-full rounded-full" disabled={isEventPast || isFullNow} onClick={() => setShowAuthModal(true)}>
                        Register Now
                      </Button>
                    )}
                    {/* Registration dialog for authenticated users only */}
                    {user && (
                    <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) setBookingStep("form"); }}>
                      <DialogTrigger asChild>
                        <Button variant={canShowQuickRegister ? "outline" : "default"} className="w-full rounded-full" disabled={isEventPast || isFullNow || isSubmitting}>
                          {isEventPast ? "Event Ended" : isFullNow ? "Event Full" : hasCustomFields ? "Register Now" : "Register with full details"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>{bookingStep === "upsells" ? "Enhance Your Experience" : `Register for ${event.title}`}</DialogTitle>
                          <DialogDescription>{bookingStep === "upsells" ? "Add extras to your booking" : bookingStep === "payment" ? `Total: ₹${priceCalculation.finalTotal}` : event.is_paid ? `Pay ₹${displayPrice} and complete the form` : "Complete your registration"}</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] pr-4">
                          <div className="py-4 space-y-4">
                            {bookingStep === "form" && (
                              <>
                                {clubSection}
                                {hasTicketCategories && (
                                  <TicketCategorySelector
                                    categories={ticketCategories}
                                    selections={categorySelections}
                                    onChange={setCategorySelections}
                                    isPaidEvent={event.is_paid}
                                  />
                                )}
                                <DynamicRegistrationForm eventId={event.id} onSubmit={handleRegister} isSubmitting={isSubmitting || isUploading || isRazorpayProcessing} isPaidEvent={event.is_paid} paymentSection={!upsellSettings?.upsell_enabled ? paymentSection : undefined} termsSection={!upsellSettings?.upsell_enabled ? termsSection : undefined} submitDisabled={!upsellSettings?.upsell_enabled && ((event.is_paid && paymentMethod === 'screenshot' && !paymentScreenshot) || (!!event.terms_conditions && !agreedToTerms)) || (hasTicketCategories && (categorySelections.length === 0 || categorySelections.some(s => s.attendees.some(a => !a.name || !a.email || !a.mobile))))} submitLabel={isSubmitting || isRazorpayProcessing ? "Processing..." : upsellSettings?.upsell_enabled && upsells.length > 0 ? "Continue" : event.is_paid && paymentMethod === 'razorpay' ? "Pay & Register" : event.is_paid ? "Submit Registration" : "Confirm Registration"} />
                              </>
                            )}
                            {bookingStep === "upsells" && (
                              <UpsellScreen upsells={upsells} basePrice={hasTicketCategories ? totalCategoryPrice : (selectedPrice !== null ? selectedPrice : (event.price || 0))} groupSize={hasTicketCategories ? 1 : groupSize} onGroupSizeChange={setGroupSize} selectedUpsells={selectedUpsells} onUpsellsChange={setSelectedUpsells} onContinue={handleUpsellContinue} onSkip={handleUpsellSkip} />
                            )}
                            {bookingStep === "payment" && (
                              <>
                                <Card className="bg-muted/50">
                                  <CardContent className="py-4 space-y-2">
                                    {hasTicketCategories && categorySelections.length > 0 ? (
                                      <>
                                        {categorySelections.map(s => (
                                          <div key={s.category.id} className="flex justify-between text-sm">
                                            <span>{s.category.name} ({s.quantity} × ₹{s.category.price})</span>
                                            <span>₹{s.category.price * s.quantity}</span>
                                          </div>
                                        ))}
                                      </>
                                    ) : (
                                      <>
                                        {selectedPrice !== null && selectedPrice < event.price && (<div className="flex justify-between text-sm"><span>Original Price ({groupSize} × ₹{event.price})</span><span className="line-through text-muted-foreground">₹{groupSize * event.price}</span></div>)}
                                        {selectedPrice !== null && selectedPrice < event.price && (<div className="flex justify-between text-sm text-green-600 font-medium"><span>🎉 Club Member Discount</span><span>-₹{(event.price - selectedPrice) * groupSize}</span></div>)}
                                        <div className="flex justify-between text-sm"><span>Tickets ({groupSize} × ₹{selectedPrice !== null ? selectedPrice : event.price})</span><span>₹{priceCalculation.baseTotal}</span></div>
                                      </>
                                    )}
                                    {priceCalculation.discounts > 0 && (<div className="flex justify-between text-sm text-green-600"><span>Group Discount</span><span>-₹{priceCalculation.discounts}</span></div>)}
                                    {priceCalculation.addonsTotal > 0 && (<div className="flex justify-between text-sm"><span>Add-ons</span><span>+₹{priceCalculation.addonsTotal}</span></div>)}
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total Payable</span><span className="text-primary">₹{priceCalculation.finalTotal}</span></div>
                                  </CardContent>
                                </Card>
                                {paymentSection}
                                {termsSection}
                                <Button onClick={() => handleRegister({})} disabled={isSubmitting || isUploading || isRazorpayProcessing || (event.is_paid && paymentMethod === 'screenshot' && !paymentScreenshot) || (!!event.terms_conditions && !agreedToTerms)} className="w-full">{isSubmitting || isRazorpayProcessing ? "Processing..." : event.is_paid && paymentMethod === 'razorpay' ? "Pay & Complete" : "Complete Registration"}</Button>
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Desktop: Organizer Card */}
            {organizer && (
              <Card>
                <CardContent className="p-4">
                  <Link to={`/o/${organizer.slug}`} className="flex items-center gap-3 rounded-lg hover:bg-muted/50 transition-colors -m-1 p-1">
                    <Avatar className="w-10 h-10 border">
                      <AvatarImage src={toDisplayUrl(organizer.logo_url, { forceImage: true }) || undefined} alt={organizer.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">{organizer.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate text-sm">{organizer.name}</span>
                        {organizer.is_verified && (<BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />)}
                      </div>
                      <p className="text-xs text-muted-foreground">Event Organizer</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;

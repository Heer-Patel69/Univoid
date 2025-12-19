import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEventById, checkUserRegistration, registerForEvent } from "@/services/eventsService";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import { Calendar, MapPin, Users, IndianRupee, ExternalLink, Clock, Share2, ArrowLeft, CheckCircle, AlertCircle, Upload, Eye } from "lucide-react";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
  });

  const { data: existingRegistration } = useQuery({
    queryKey: ["registration", eventId, user?.id],
    queryFn: () => checkUserRegistration(eventId!, user!.id),
    enabled: !!eventId && !!user,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user || !event) throw new Error("Missing data");

      let screenshotUrl = null;
      
      if (event.is_paid && paymentScreenshot) {
        setUploading(true);
        const fileExt = paymentScreenshot.name.split(".").pop();
        const fileName = `${user.id}/${eventId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("event-assets")
          .upload(`payment-screenshots/${fileName}`, paymentScreenshot);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("event-assets")
          .getPublicUrl(`payment-screenshots/${fileName}`);
        
        screenshotUrl = publicUrl;
        setUploading(false);
      }

      return registerForEvent({
        event_id: eventId!,
        user_id: user.id,
        custom_data: customData,
        payment_screenshot_url: screenshotUrl || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: event?.is_paid ? "Registration Submitted!" : "Registration Confirmed!",
        description: event?.is_paid 
          ? "Your payment is pending verification."
          : "You're registered! Check your tickets.",
      });
      setIsRegisterOpen(false);
      queryClient.invalidateQueries({ queryKey: ["registration", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleShare = async () => {
    try {
      await navigator.share({ title: event?.title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!" });
    }
  };

  const isEventPast = event ? isPast(new Date(event.start_date)) : false;
  const isFull = event?.max_capacity ? event.registrations_count >= event.max_capacity : false;

  if (eventLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video rounded-3xl" />
              <Skeleton className="h-10 w-3/4" />
            </div>
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Link to="/events"><Button>Back to Events</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate("/events")}>
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Flyer */}
            <div className="relative rounded-3xl overflow-hidden bg-muted">
              {event.flyer_url ? (
                <img src={event.flyer_url} alt={event.title} className="w-full aspect-video object-cover" />
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
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
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

                {event.max_capacity && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{event.registrations_count} registered</span>
                        <span>{event.max_capacity} spots</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isFull ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min((event.registrations_count / event.max_capacity) * 100, 100)}%` }} />
                      </div>
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
                      <Button className="w-full rounded-full text-lg py-6" disabled={isEventPast || isFull || !user} onClick={() => !user && setShowAuthModal(true)}>
                        {!user ? "Login to Register" : isEventPast ? "Event Ended" : isFull ? "Event Full" : "Register Now"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Register for {event.title}</DialogTitle>
                        <DialogDescription>{event.is_paid ? `Pay ₹${event.price} and upload screenshot` : "Complete your registration"}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {event.is_paid && (
                          <div className="space-y-4 p-4 bg-muted rounded-xl">
                            <p className="font-medium">Payment Instructions</p>
                            <p className="text-sm text-muted-foreground">Pay ₹{event.price} using UPI, then upload screenshot.</p>
                            {event.upi_qr_url && (
                              <div className="bg-white p-4 rounded-xl w-fit mx-auto">
                                <img src={event.upi_qr_url} alt="UPI QR" className="w-48 h-48 object-contain" />
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
                        )}
                        {event.terms_conditions && (
                          <div className="flex items-start gap-2">
                            <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(c === true)} />
                            <label htmlFor="terms" className="text-sm text-muted-foreground">I agree to terms</label>
                          </div>
                        )}
                        <Button className="w-full rounded-full" onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending || uploading || (event.is_paid && !paymentScreenshot) || (!!event.terms_conditions && !agreedToTerms)}>
                          {uploading || registerMutation.isPending ? "Submitting..." : event.is_paid ? "Submit Registration" : "Confirm"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default EventDetail;

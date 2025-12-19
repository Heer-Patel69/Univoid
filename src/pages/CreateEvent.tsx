import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import { ArrowLeft, ArrowRight, Check, Calendar, FileText, Ticket, CreditCard, Image } from "lucide-react";

const STEPS = [
  { id: 1, title: "Basic Info", icon: Calendar },
  { id: 2, title: "Description", icon: FileText },
  { id: 3, title: "Ticketing", icon: Ticket },
  { id: 4, title: "Payment", icon: CreditCard },
];

const CATEGORIES = ["Tech", "Cultural", "Sports", "Academic", "Workshop", "Seminar"];
const EVENT_TYPES = ["Hackathon", "Party", "Conference", "Workshop", "Competition", "Meetup", "Festival"];

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    event_type: "",
    flyer_url: "",
    is_location_decided: false,
    venue_name: "",
    venue_address: "",
    maps_link: "",
    start_date: "",
    end_date: "",
    description: "",
    terms_conditions: "",
    is_paid: false,
    price: 0,
    max_capacity: "",
    upi_qr_url: "",
    upi_vpa: "",
  });

  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const updateForm = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      setUploading(true);

      let flyerUrl = formData.flyer_url;
      let upiQrUrl = formData.upi_qr_url;

      // Upload flyer
      if (flyerFile) {
        const ext = flyerFile.name.split(".").pop();
        const path = `${user.id}/flyers/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("event-assets").upload(path, flyerFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("event-assets").getPublicUrl(path);
        flyerUrl = publicUrl;
      }

      // Upload UPI QR
      if (qrFile && formData.is_paid) {
        const ext = qrFile.name.split(".").pop();
        const path = `${user.id}/upi-qr/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("event-assets").upload(path, qrFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("event-assets").getPublicUrl(path);
        upiQrUrl = publicUrl;
      }

      const { data, error } = await supabase.from("events").insert({
        organizer_id: user.id,
        title: formData.title,
        category: formData.category,
        event_type: formData.event_type,
        flyer_url: flyerUrl || null,
        is_location_decided: formData.is_location_decided,
        venue_name: formData.is_location_decided ? formData.venue_name : null,
        venue_address: formData.is_location_decided ? formData.venue_address : null,
        maps_link: formData.is_location_decided ? formData.maps_link : null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        description: formData.description || null,
        terms_conditions: formData.terms_conditions || null,
        is_paid: formData.is_paid,
        price: formData.is_paid ? formData.price : 0,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        upi_qr_url: formData.is_paid ? upiQrUrl : null,
        upi_vpa: formData.is_paid ? formData.upi_vpa : null,
        status: "published",
      }).select().single();

      if (error) throw error;
      setUploading(false);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Event Created!", description: "Your event is now live." });
      navigate(`/events/${data.id}`);
    },
    onError: (error: Error) => {
      setUploading(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.title && formData.category && formData.event_type && formData.start_date;
      case 2: return true;
      case 3: return true;
      case 4: return !formData.is_paid || (formData.upi_vpa || qrFile);
      default: return true;
    }
  };

  const nextStep = () => currentStep < 4 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to create events.</p>
          <Button onClick={() => setShowAuthModal(true)}>Login</Button>
        </main>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-3xl">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate("/events")}>
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Button>

        <h1 className="font-display text-3xl font-bold mb-8">Create Event</h1>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep >= step.id ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
              }`}>
                {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <span className={`ml-2 hidden sm:block text-sm font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
              {idx < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Set up the basic details of your event"}
              {currentStep === 2 && "Add a description and any terms"}
              {currentStep === 3 && "Configure ticketing options"}
              {currentStep === 4 && "Set up payment collection"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input value={formData.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="e.g., Tech Hackathon 2024" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={formData.category} onValueChange={(v) => updateForm("category", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Type *</Label>
                    <Select value={formData.event_type} onValueChange={(v) => updateForm("event_type", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(t => <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Event Flyer</Label>
                  <div className="border-2 border-dashed rounded-xl p-4 text-center">
                    <Input type="file" accept="image/*" onChange={(e) => setFlyerFile(e.target.files?.[0] || null)} className="hidden" id="flyer" />
                    <label htmlFor="flyer" className="cursor-pointer flex flex-col items-center gap-2">
                      <Image className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{flyerFile ? flyerFile.name : "Upload flyer image"}</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date & Time *</Label>
                    <Input type="datetime-local" value={formData.start_date} onChange={(e) => updateForm("start_date", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date & Time</Label>
                    <Input type="datetime-local" value={formData.end_date} onChange={(e) => updateForm("end_date", e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <Label>Is location decided?</Label>
                  <Switch checked={formData.is_location_decided} onCheckedChange={(c) => updateForm("is_location_decided", c)} />
                </div>

                {formData.is_location_decided && (
                  <div className="space-y-4 p-4 border rounded-xl">
                    <div className="space-y-2">
                      <Label>Venue Name</Label>
                      <Input value={formData.venue_name} onChange={(e) => updateForm("venue_name", e.target.value)} placeholder="e.g., Main Auditorium" />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={formData.venue_address} onChange={(e) => updateForm("venue_address", e.target.value)} placeholder="Full address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Google Maps Link</Label>
                      <Input value={formData.maps_link} onChange={(e) => updateForm("maps_link", e.target.value)} placeholder="https://maps.google.com/..." />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Description */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Describe your event..." rows={8} />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea value={formData.terms_conditions} onChange={(e) => updateForm("terms_conditions", e.target.value)} placeholder="Any rules or terms..." rows={4} />
                </div>
              </>
            )}

            {/* Step 3: Ticketing */}
            {currentStep === 3 && (
              <>
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div>
                    <Label className="text-base">Paid Event</Label>
                    <p className="text-sm text-muted-foreground">Toggle on if this is a paid event</p>
                  </div>
                  <Switch checked={formData.is_paid} onCheckedChange={(c) => updateForm("is_paid", c)} />
                </div>

                {formData.is_paid && (
                  <div className="space-y-2">
                    <Label>Ticket Price (₹) *</Label>
                    <Input type="number" value={formData.price} onChange={(e) => updateForm("price", parseFloat(e.target.value) || 0)} placeholder="500" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Max Capacity (optional)</Label>
                  <Input type="number" value={formData.max_capacity} onChange={(e) => updateForm("max_capacity", e.target.value)} placeholder="100" />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                </div>
              </>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <>
                {!formData.is_paid ? (
                  <div className="text-center py-8">
                    <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">This is a free event</h3>
                    <p className="text-muted-foreground">No payment setup required</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Users will pay you directly via UPI. Upload your QR code and VPA ID.</p>
                    <div className="space-y-2">
                      <Label>UPI QR Code</Label>
                      <div className="border-2 border-dashed rounded-xl p-4 text-center">
                        <Input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] || null)} className="hidden" id="qr" />
                        <label htmlFor="qr" className="cursor-pointer flex flex-col items-center gap-2">
                          <Image className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{qrFile ? qrFile.name : "Upload UPI QR image"}</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>UPI VPA ID</Label>
                      <Input value={formData.upi_vpa} onChange={(e) => updateForm("upi_vpa", e.target.value)} placeholder="yourname@upi" />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}><ArrowLeft className="w-4 h-4 mr-2" /> Previous</Button>
              {currentStep < 4 ? (
                <Button onClick={nextStep} disabled={!canProceed()}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
              ) : (
                <Button onClick={() => createEventMutation.mutate()} disabled={!canProceed() || createEventMutation.isPending || uploading}>
                  {uploading || createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default CreateEvent;

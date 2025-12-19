import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import { Plus, Calendar, Users, CheckCircle, XCircle, Eye, QrCode, ScanLine, Pencil } from "lucide-react";
import { format } from "date-fns";
import type { Event, EventRegistration } from "@/services/eventsService";

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");

  // Fetch organizer's events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["organizer-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!user,
  });

  // Fetch registrations for selected event
  const { data: registrations } = useQuery({
    queryKey: ["event-registrations", selectedEvent],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", selectedEvent!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventRegistration[];
    },
    enabled: !!selectedEvent,
  });

  // Approve/Reject mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({ payment_status: status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status Updated" });
      queryClient.invalidateQueries({ queryKey: ["event-registrations", selectedEvent] });
    },
  });

  // QR Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const { data: ticket, error: fetchError } = await supabase
        .from("event_tickets")
        .select("*")
        .eq("qr_code", qrCode)
        .eq("event_id", selectedEvent!)
        .single();

      if (fetchError || !ticket) throw new Error("Invalid ticket");
      if (ticket.is_used) throw new Error("Ticket already used");

      const { error } = await supabase
        .from("event_tickets")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("id", ticket.id);

      if (error) throw error;
      return ticket;
    },
    onSuccess: () => {
      toast({ title: "✅ Check-in Successful!" });
      setQrInput("");
    },
    onError: (error: Error) => {
      toast({ title: "❌ Check-in Failed", description: error.message, variant: "destructive" });
    },
  });

  const selectedEventData = events?.find(e => e.id === selectedEvent);
  const pendingCount = registrations?.filter(r => r.payment_status === "pending").length || 0;

  useEffect(() => {
    if (events && events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0].id);
    }
  }, [events, selectedEvent]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
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

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Organizer Dashboard</h1>
            <p className="text-muted-foreground">Manage your events and registrations</p>
          </div>
          <Link to="/organizer/create-event">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create Event</Button>
          </Link>
        </div>

        {eventsLoading ? (
          <div className="text-center py-20">Loading...</div>
        ) : events?.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-6">Create your first event to get started</p>
              <Link to="/organizer/create-event"><Button>Create Event</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Events List */}
            <div className="lg:col-span-1 space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">Your Events</p>
              {events?.map(event => (
                <Card 
                  key={event.id} 
                  className={`cursor-pointer transition-all ${selectedEvent === event.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                  onClick={() => setSelectedEvent(event.id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold line-clamp-1">{event.title}</h4>
                    <p className="text-xs text-muted-foreground">{format(new Date(event.start_date), "MMM d, yyyy")}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{event.registrations_count} reg</Badge>
                      <Badge variant={event.status === "published" ? "default" : "secondary"} className="text-xs">{event.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Event Details */}
            <div className="lg:col-span-3">
              {selectedEventData && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedEventData.title}</CardTitle>
                        <CardDescription>{format(new Date(selectedEventData.start_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/events/${selectedEventData.id}`}>
                          <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" /> View</Button>
                        </Link>
                        <Link to={`/organizer/edit-event/${selectedEventData.id}`}>
                          <Button variant="outline" size="sm"><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)}>
                          <ScanLine className="w-4 h-4 mr-1" /> Check-in
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="pending">
                      <TabsList>
                        <TabsTrigger value="pending">
                          Pending {pendingCount > 0 && <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                      </TabsList>

                      {["pending", "approved", "rejected"].map(status => (
                        <TabsContent key={status} value={status} className="space-y-3">
                          {registrations?.filter(r => r.payment_status === status).length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">No {status} registrations</p>
                          ) : (
                            registrations?.filter(r => r.payment_status === status).map(reg => (
                              <Card key={reg.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">User {reg.user_id.slice(0, 8)}...</p>
                                      <p className="text-xs text-muted-foreground">{format(new Date(reg.created_at), "MMM d, h:mm a")}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {reg.payment_screenshot_url && (
                                      <a href={reg.payment_screenshot_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm">View Screenshot</Button>
                                      </a>
                                    )}
                                    {status === "pending" && (
                                      <>
                                        <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "approved" })}>
                                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "rejected" })}>
                                          <XCircle className="w-4 h-4 mr-1" /> Reject
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* QR Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in Scanner</DialogTitle>
            <DialogDescription>Enter or scan the ticket QR code</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Enter QR code..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <Button onClick={() => checkInMutation.mutate(qrInput)} disabled={!qrInput || checkInMutation.isPending}>
                {checkInMutation.isPending ? "Checking..." : "Check In"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Paste the QR code text or scan it with your device's camera</p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default OrganizerDashboard;

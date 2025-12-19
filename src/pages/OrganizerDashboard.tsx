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
import QRScanner from "@/components/events/QRScanner";
import { 
  Plus, Calendar, Users, CheckCircle, XCircle, Eye, 
  ScanLine, Pencil, TicketCheck, Clock, TrendingUp 
} from "lucide-react";
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

  // Fetch check-in stats
  const { data: checkInStats } = useQuery({
    queryKey: ["event-checkin-stats", selectedEvent],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("is_used")
        .eq("event_id", selectedEvent!);
      if (error) throw error;
      const total = data?.length || 0;
      const checkedIn = data?.filter(t => t.is_used).length || 0;
      return { total, checkedIn };
    },
    enabled: !!selectedEvent,
  });

  // Calculate stats
  const totalEvents = events?.length || 0;
  const totalRegistrations = events?.reduce((sum, e) => sum + (e.registrations_count || 0), 0) || 0;
  const pendingCount = registrations?.filter(r => r.payment_status === "pending").length || 0;
  const approvedCount = registrations?.filter(r => r.payment_status === "approved").length || 0;

  // Approve/Reject mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, userId }: { id: string; status: "approved" | "rejected"; userId: string }) => {
      let qrCode = null;
      
      if (status === "approved") {
        qrCode = `UV-${selectedEvent}-${id}-${Date.now()}`;
        
        const { error: ticketError } = await supabase
          .from("event_tickets")
          .insert({
            registration_id: id,
            event_id: selectedEvent!,
            user_id: userId,
            qr_code: qrCode,
          });
        
        if (ticketError) {
          console.error("Ticket creation error:", ticketError);
          throw new Error("Failed to generate ticket");
        }
      }
      
      const { error } = await supabase
        .from("event_registrations")
        .update({ payment_status: status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      try {
        await supabase.functions.invoke("send-registration-status-email", {
          body: {
            registrationId: id,
            status,
            eventId: selectedEvent,
            userId,
            qrCode,
          },
        });
      } catch (emailError) {
        console.error("Failed to send status email:", emailError);
      }
    },
    onSuccess: (_, { status }) => {
      toast({ title: status === "approved" ? "✅ Approved & QR Sent!" : "❌ Registration Rejected" });
      queryClient.invalidateQueries({ queryKey: ["event-registrations", selectedEvent] });
      queryClient.invalidateQueries({ queryKey: ["event-checkin-stats", selectedEvent] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["event-checkin-stats", selectedEvent] });
    },
    onError: (error: Error) => {
      toast({ title: "❌ Check-in Failed", description: error.message, variant: "destructive" });
    },
  });

  const selectedEventData = events?.find(e => e.id === selectedEvent);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Organizer Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your events and registrations</p>
          </div>
          <Link to="/organizer/create-event">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create Event</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEvents}</p>
                  <p className="text-xs text-muted-foreground">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalRegistrations}</p>
                  <p className="text-xs text-muted-foreground">Registrations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TicketCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{checkInStats?.checkedIn || 0}</p>
                  <p className="text-xs text-muted-foreground">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  className={`cursor-pointer transition-all ${selectedEvent === event.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"}`}
                  onClick={() => setSelectedEvent(event.id)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold line-clamp-1 text-sm">{event.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(event.start_date), "MMM d, yyyy")}</p>
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
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-lg">{selectedEventData.title}</CardTitle>
                        <CardDescription className="text-sm">{format(new Date(selectedEventData.start_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/events/${selectedEventData.id}`}>
                          <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" /> View</Button>
                        </Link>
                        <Link to={`/organizer/edit-event/${selectedEventData.id}`}>
                          <Button variant="outline" size="sm"><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                        </Link>
                        <Button size="sm" onClick={() => setScannerOpen(true)} className="gap-1">
                          <ScanLine className="w-4 h-4" /> Scan QR
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="pending">
                      <TabsList className="mb-4">
                        <TabsTrigger value="pending" className="gap-1">
                          Pending 
                          {pendingCount > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5">{pendingCount}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                      </TabsList>

                      {["pending", "approved", "rejected"].map(status => (
                        <TabsContent key={status} value={status} className="space-y-3 mt-0">
                          {registrations?.filter(r => r.payment_status === status).length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground text-sm">No {status} registrations</p>
                          ) : (
                            registrations?.filter(r => r.payment_status === status).map(reg => (
                              <Card key={reg.id} className="border">
                                <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback className="text-xs">U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-sm">User {reg.user_id.slice(0, 8)}...</p>
                                      <p className="text-xs text-muted-foreground">{format(new Date(reg.created_at), "MMM d, h:mm a")}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    {reg.payment_screenshot_url && (
                                      <a href={reg.payment_screenshot_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm" className="text-xs">Screenshot</Button>
                                      </a>
                                    )}
                                    {status === "pending" && (
                                      <>
                                        <Button size="sm" className="flex-1 sm:flex-none text-xs" onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "approved", userId: reg.user_id })}>
                                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" className="flex-1 sm:flex-none text-xs" onClick={() => updateStatusMutation.mutate({ id: reg.id, status: "rejected", userId: reg.user_id })}>
                                          <XCircle className="w-3 h-3 mr-1" /> Reject
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
      <Dialog open={scannerOpen} onOpenChange={(open) => {
        setScannerOpen(open);
        if (!open) setQrInput("");
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Check-in Scanner
            </DialogTitle>
            <DialogDescription>
              Scan attendee QR codes to check them in
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="camera" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">Camera Scan</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>
            
            <TabsContent value="camera" className="mt-4">
              {selectedEvent && (
                <QRScanner
                  eventId={selectedEvent}
                  onScan={async (qrCode) => {
                    await checkInMutation.mutateAsync(qrCode);
                  }}
                />
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Enter or paste QR code..."
                    className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
                  />
                  <Button 
                    onClick={() => checkInMutation.mutate(qrInput)} 
                    disabled={!qrInput || checkInMutation.isPending}
                  >
                    {checkInMutation.isPending ? "..." : "Check In"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Paste the QR code text from the attendee's ticket
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Check-in Stats */}
          {checkInStats && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{checkInStats.checkedIn}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{checkInStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default OrganizerDashboard;

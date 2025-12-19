import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import QRScanner from "@/components/events/QRScanner";
import { 
  ScanLine, ArrowLeft, CheckCircle, XCircle, 
  Users, TicketCheck, Clock, AlertTriangle, User
} from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@/services/eventsService";

interface CheckInResult {
  success: boolean;
  attendeeName: string;
  ticketId: string;
  alreadyUsed?: boolean;
  usedAt?: string;
}

const EventCheckIn = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResult | null>(null);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId!)
        .single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId && !!user,
  });

  // Check if user is the organizer
  const isOrganizer = user?.id === event?.organizer_id;

  // Fetch check-in stats
  const { data: checkInStats, refetch: refetchStats } = useQuery({
    queryKey: ["event-checkin-stats", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("is_used, used_at")
        .eq("event_id", eventId!);
      if (error) throw error;
      const total = data?.length || 0;
      const checkedIn = data?.filter(t => t.is_used).length || 0;
      return { total, checkedIn, percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0 };
    },
    enabled: !!eventId && !!user,
    refetchInterval: 5000, // Auto refresh every 5 seconds
  });

  // Fetch recent check-ins
  const { data: recentCheckIns } = useQuery({
    queryKey: ["recent-checkins", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select(`
          id,
          is_used,
          used_at,
          user_id
        `)
        .eq("event_id", eventId!)
        .eq("is_used", true)
        .order("used_at", { ascending: false })
        .limit(10);
      if (error) throw error;

      // Fetch user profiles
      const userIds = data?.map(t => t.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_photo_url")
        .in("id", userIds);

      return data?.map(ticket => ({
        ...ticket,
        profile: profiles?.find(p => p.id === ticket.user_id),
      }));
    },
    enabled: !!eventId && !!user,
    refetchInterval: 5000,
  });

  // Check-in mutation with attendee info
  const checkInMutation = useMutation({
    mutationFn: async (qrCode: string): Promise<CheckInResult> => {
      console.log("=== CHECK-IN ATTEMPT ===");
      console.log("QR Code:", qrCode);
      console.log("Event ID:", eventId);

      // Try to find ticket by exact QR code match
      let { data: ticket, error: fetchError } = await supabase
        .from("event_tickets")
        .select("*, registration:event_registrations(*)")
        .eq("qr_code", qrCode)
        .eq("event_id", eventId!)
        .single();

      // If not found, try parsing as JSON (in case QR contains structured data)
      if (fetchError && qrCode.startsWith("{")) {
        try {
          const parsed = JSON.parse(qrCode);
          if (parsed.ticketId || parsed.qr_code) {
            const code = parsed.ticketId || parsed.qr_code;
            const result = await supabase
              .from("event_tickets")
              .select("*, registration:event_registrations(*)")
              .eq("qr_code", code)
              .eq("event_id", eventId!)
              .single();
            ticket = result.data;
            fetchError = result.error;
          }
        } catch (e) {
          console.log("QR is not JSON");
        }
      }

      if (fetchError || !ticket) {
        console.error("Ticket not found:", fetchError);
        throw new Error("Invalid ticket - not found for this event");
      }

      // Get attendee name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, profile_photo_url")
        .eq("id", ticket.user_id)
        .single();

      const attendeeName = profile?.full_name || "Unknown Attendee";

      // Check if already used
      if (ticket.is_used) {
        const usedTime = ticket.used_at ? format(new Date(ticket.used_at), "h:mm a") : "earlier";
        return {
          success: false,
          attendeeName,
          ticketId: ticket.id,
          alreadyUsed: true,
          usedAt: usedTime,
        };
      }

      // Mark as used
      const { error: updateError } = await supabase
        .from("event_tickets")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("id", ticket.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw new Error("Failed to check in");
      }

      console.log("✅ Check-in successful for:", attendeeName);

      return {
        success: true,
        attendeeName,
        ticketId: ticket.id,
      };
    },
    onSuccess: (result) => {
      setLastCheckIn(result);
      
      if (result.alreadyUsed) {
        toast({ 
          title: "⚠️ Already Checked In", 
          description: `${result.attendeeName} was already checked in at ${result.usedAt}`,
          variant: "destructive" 
        });
      } else {
        toast({ title: `✅ ${result.attendeeName} checked in!` });
      }
      
      setQrInput("");
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["recent-checkins", eventId] });
      
      // Clear last check-in after 5 seconds
      setTimeout(() => setLastCheckIn(null), 5000);
    },
    onError: (error: Error) => {
      setLastCheckIn(null);
      toast({ title: "❌ Check-in Failed", description: error.message, variant: "destructive" });
    },
  });

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

  if (eventLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading event...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Link to="/organizer/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Only the event organizer can access check-in</p>
          <Link to="/events">
            <Button>View Events</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-2xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => navigate("/organizer/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {/* Event Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>
                  {format(new Date(event.start_date), "EEEE, MMM d 'at' h:mm a")}
                </CardDescription>
              </div>
              <Badge variant={event.status === "published" ? "default" : "secondary"}>
                {event.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <TicketCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-600">{checkInStats?.checkedIn || 0}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-blue-600">{checkInStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-orange-600">
                  {(checkInStats?.total || 0) - (checkInStats?.checkedIn || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Check-in Progress</span>
                <span className="font-medium">{checkInStats?.percentage || 0}%</span>
              </div>
              <Progress value={checkInStats?.percentage || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Last Check-in Result */}
        {lastCheckIn && (
          <Card className={`mb-6 border-2 ${lastCheckIn.success ? 'border-green-500 bg-green-500/5' : 'border-orange-500 bg-orange-500/5'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {lastCheckIn.success ? (
                  <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-orange-500 flex-shrink-0" />
                )}
                <div>
                  <p className="font-bold text-lg">{lastCheckIn.attendeeName}</p>
                  <p className={`text-sm ${lastCheckIn.success ? 'text-green-600' : 'text-orange-600'}`}>
                    {lastCheckIn.success ? 'Successfully checked in!' : `Already checked in at ${lastCheckIn.usedAt}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanner */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanLine className="w-5 h-5" />
              Check-in Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="camera">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="camera">Camera Scan</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>

              <TabsContent value="camera">
                <QRScanner
                  eventId={eventId!}
                  onScan={async (qrCode) => {
                    await checkInMutation.mutateAsync(qrCode);
                  }}
                />
              </TabsContent>

              <TabsContent value="manual">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && qrInput && checkInMutation.mutate(qrInput)}
                      placeholder="Enter or paste QR code..."
                      className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm"
                      autoFocus
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
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        {recentCheckIns && recentCheckIns.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentCheckIns.map((checkin) => (
                  <div key={checkin.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={checkin.profile?.profile_photo_url || ""} />
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {checkin.profile?.full_name || "Unknown"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {checkin.used_at ? format(new Date(checkin.used_at), "h:mm a") : ""}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default EventCheckIn;

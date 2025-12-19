import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import { Ticket, Calendar, MapPin, Clock, CheckCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import QRCode from "qrcode";
import { useEffect } from "react";

interface TicketWithEvent {
  id: string;
  qr_code: string;
  is_used: boolean;
  created_at: string;
  event: {
    id: string;
    title: string;
    start_date: string;
    venue_name: string | null;
    flyer_url: string | null;
  };
  registration: {
    payment_status: string;
  };
}

const MyTickets = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select(`
          id, qr_code, is_used, created_at,
          event:events(id, title, start_date, venue_name, flyer_url),
          registration:event_registrations(payment_status)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TicketWithEvent[];
    },
    enabled: !!user,
  });

  // Generate QR codes
  useEffect(() => {
    if (tickets) {
      tickets.forEach(async (ticket) => {
        if (!qrImages[ticket.id]) {
          const url = await QRCode.toDataURL(ticket.qr_code, { width: 200, margin: 2 });
          setQrImages(prev => ({ ...prev, [ticket.id]: url }));
        }
      });
    }
  }, [tickets, qrImages]);

  const upcomingTickets = tickets?.filter(t => !isPast(new Date(t.event.start_date)) && !t.is_used) || [];
  const usedTickets = tickets?.filter(t => t.is_used) || [];
  const pastTickets = tickets?.filter(t => isPast(new Date(t.event.start_date)) && !t.is_used) || [];

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        </main>
        <Footer />
      </div>
    );
  }

  const TicketCard = ({ ticket }: { ticket: TicketWithEvent }) => (
    <Card className={`overflow-hidden ${ticket.is_used ? "opacity-60" : ""}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Event Info */}
          <div className="flex-1 p-4 sm:p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-lg">{ticket.event.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(ticket.event.start_date), "EEE, MMM d 'at' h:mm a")}
                </div>
                {ticket.event.venue_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {ticket.event.venue_name}
                  </div>
                )}
              </div>
              {ticket.is_used ? (
                <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" /> Used</Badge>
              ) : isPast(new Date(ticket.event.start_date)) ? (
                <Badge variant="outline">Expired</Badge>
              ) : (
                <Badge className="bg-green-500">Valid</Badge>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="border-t sm:border-t-0 sm:border-l border-dashed p-4 flex flex-col items-center justify-center bg-muted/30 min-w-[160px]">
            {qrImages[ticket.id] ? (
              <img src={qrImages[ticket.id]} alt="Ticket QR" className="w-32 h-32 rounded-lg" />
            ) : (
              <div className="w-32 h-32 bg-muted rounded-lg animate-pulse" />
            )}
            <p className="text-xs text-muted-foreground mt-2 text-center">Show at entry</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthClick={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Ticket className="w-8 h-8 text-primary" />
            My Tickets
          </h1>
          <p className="text-muted-foreground">Your event tickets and passes</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="h-40 animate-pulse bg-muted" />
            ))}
          </div>
        ) : tickets?.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground">Register for events to get your tickets here</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming">
                Upcoming <Badge variant="secondary" className="ml-2">{upcomingTickets.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="used">Used</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingTickets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No upcoming tickets</p>
              ) : (
                upcomingTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
            </TabsContent>

            <TabsContent value="used" className="space-y-4">
              {usedTickets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No used tickets</p>
              ) : (
                usedTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastTickets.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No past tickets</p>
              ) : (
                pastTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default MyTickets;

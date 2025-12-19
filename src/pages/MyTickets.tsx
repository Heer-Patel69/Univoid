import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  ChevronLeft,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SectionLoader } from '@/components/common/SectionLoader';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTickets } from '@/services/eventsService';
import type { EventTicket } from '@/types/events';
import QRCode from 'qrcode';

export default function MyTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getUserTickets(user.id);
      setTickets(data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openTicketModal = async (ticket: EventTicket) => {
    setSelectedTicket(ticket);
    try {
      const dataUrl = await QRCode.toDataURL(ticket.qr_code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        );
      case 'used':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Used
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/events')}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Tickets</h1>
          <p className="text-muted-foreground">
            Your registered events and tickets
          </p>
        </div>

        {isLoading ? (
          <SectionLoader />
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Tickets Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Register for events to see your tickets here
            </p>
            <Button onClick={() => navigate('/events')}>
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => openTicketModal(ticket)}
              >
                {ticket.event && (
                  <>
                    <div className="relative aspect-video">
                      <img
                        src={ticket.event.banner_image_url}
                        alt={ticket.event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {ticket.event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(ticket.event.start_datetime), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">
                          {ticket.event.location_finalized
                            ? ticket.event.venue_name
                            : ticket.event.city}
                        </span>
                      </div>
                      <Button variant="outline" className="w-full mt-2">
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR Code
                      </Button>
                    </CardContent>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav />

      {/* Ticket Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Your Ticket</DialogTitle>
          </DialogHeader>

          {selectedTicket && selectedTicket.event && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg text-foreground">
                  {selectedTicket.event.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedTicket.event.start_datetime), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedTicket.event.start_datetime), 'h:mm a')}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Ticket QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="text-center">
                {getStatusBadge(selectedTicket.status)}
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>Show this QR code at the event entrance</p>
                <p className="font-mono mt-1">
                  Ticket ID: {selectedTicket.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setSelectedTicket(null);
                  navigate(`/events/${selectedTicket.event_id}`);
                }}
              >
                View Event Details
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

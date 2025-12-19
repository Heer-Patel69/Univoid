import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  Share2,
  Heart,
  ChevronLeft,
  Ticket,
  AlertCircle,
  CheckCircle,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Globe,
  MapPinned,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionLoader } from '@/components/common/SectionLoader';
import AuthModal from '@/components/auth/AuthModal';
import { EventRegistrationModal } from '@/components/events/EventRegistrationModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  getEventById,
  getUserRegistration,
  getUserTicket,
  getEventUpdates,
  getEventQuestions,
} from '@/services/eventsService';
import type { Event, EventRegistration, EventTicket, EventUpdate, EventCustomQuestion } from '@/types/events';
import { EVENT_CATEGORIES, EVENT_TYPES } from '@/types/events';
import ReportButton from '@/components/reports/ReportButton';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [ticket, setTicket] = useState<EventTicket | null>(null);
  const [updates, setUpdates] = useState<EventUpdate[]>([]);
  const [questions, setQuestions] = useState<EventCustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id, user]);

  const loadEventData = async () => {
    setIsLoading(true);
    try {
      const eventData = await getEventById(id!);
      if (!eventData) {
        navigate('/events');
        return;
      }
      setEvent(eventData);

      const [updatesData, questionsData] = await Promise.all([
        getEventUpdates(id!),
        getEventQuestions(id!),
      ]);
      setUpdates(updatesData);
      setQuestions(questionsData);

      if (user) {
        const [regData, ticketData] = await Promise.all([
          getUserRegistration(id!, user.id),
          getUserTicket(id!, user.id),
        ]);
        setRegistration(regData);
        setTicket(ticketData);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      toast.error('Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setRegisterOpen(true);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event?.title,
        text: `Check out this event: ${event?.title}`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getRegistrationStatus = () => {
    if (!registration) return null;
    
    if (event?.is_paid) {
      switch (registration.payment_status) {
        case 'pending':
          return { icon: AlertCircle, text: 'Payment Pending Review', color: 'text-yellow-500' };
        case 'approved':
          return { icon: CheckCircle, text: 'Registered', color: 'text-green-500' };
        case 'rejected':
          return { icon: AlertCircle, text: 'Payment Rejected', color: 'text-red-500' };
      }
    }
    return { icon: CheckCircle, text: 'Registered', color: 'text-green-500' };
  };

  const socialLinks = event ? [
    { icon: Instagram, url: event.organizer_instagram, label: 'Instagram' },
    { icon: Linkedin, url: event.organizer_linkedin, label: 'LinkedIn' },
    { icon: Twitter, url: event.organizer_twitter, label: 'Twitter' },
    { icon: Facebook, url: event.organizer_facebook, label: 'Facebook' },
    { icon: Youtube, url: event.organizer_youtube, label: 'YouTube' },
    { icon: Globe, url: event.organizer_website, label: 'Website' },
  ].filter((link) => link.url) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onAuthClick={() => setAuthOpen(true)} />
        <main className="container mx-auto px-4 py-8">
          <SectionLoader />
        </main>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const registrationStatus = getRegistrationStatus();
  const isEventPast = new Date(event.end_datetime) < new Date();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAuthClick={() => setAuthOpen(true)} />

      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/events')}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Banner */}
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <img
                src={event.banner_image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                  {EVENT_CATEGORIES.find((c) => c.value === event.category)?.label}
                </Badge>
                <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                  {EVENT_TYPES.find((t) => t.value === event.event_type)?.label}
                </Badge>
              </div>
            </div>

            {/* Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {event.title}
                </h1>
                <p className="text-muted-foreground">
                  Organized by <span className="text-foreground font-medium">{event.organizer_name}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <ReportButton
                  contentId={event.id}
                  contentType="blogs"
                  contentOwnerId={event.organizer_id}
                />
              </div>
            </div>

            {/* Updates Banner */}
            {updates.length > 0 && updates[0].is_critical && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground">{updates[0].title}</h4>
                    <p className="text-sm text-muted-foreground">{updates[0].message}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="rules">Rules & Terms</TabsTrigger>
                {updates.length > 0 && (
                  <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: event.description.replace(/\n/g, '<br />') 
                      }} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="mt-6 space-y-4">
                {event.rules && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Event Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: event.rules.replace(/\n/g, '<br />') 
                        }} 
                      />
                    </CardContent>
                  </Card>
                )}
                {event.terms_conditions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Terms & Conditions</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: event.terms_conditions.replace(/\n/g, '<br />') 
                        }} 
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="updates" className="mt-6">
                <div className="space-y-4">
                  {updates.map((update) => (
                    <Card key={update.id} className={update.is_critical ? 'border-yellow-500/50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              {update.is_critical && (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              )}
                              {update.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">{update.message}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(update.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-6">
                {/* Date & Time */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-foreground">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.start_datetime), 'h:mm a')} - {format(new Date(event.end_datetime), 'h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 text-foreground">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      {event.location_finalized ? (
                        <>
                          <p className="font-medium">{event.venue_name}</p>
                          <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                          {event.venue_landmark && (
                            <p className="text-sm text-muted-foreground">Near: {event.venue_landmark}</p>
                          )}
                          {event.google_maps_link && (
                            <a
                              href={event.google_maps_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                            >
                              <MapPinned className="h-3 w-3" />
                              Open in Google Maps
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-medium">{event.city}</p>
                          <p className="text-sm text-muted-foreground">
                            Exact location to be announced
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Registrations */}
                  <div className="flex items-center gap-3 text-foreground">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{event.registrations_count} registered</p>
                      {event.max_registrations && (
                        <p className="text-sm text-muted-foreground">
                          {event.max_registrations - event.registrations_count} spots left
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Price & Registration */}
                <div className="space-y-4">
                  {event.is_paid && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">₹{event.ticket_price}</p>
                      <p className="text-sm text-muted-foreground">per ticket</p>
                    </div>
                  )}

                  {registrationStatus ? (
                    <div className="space-y-3">
                      <div className={`flex items-center justify-center gap-2 ${registrationStatus.color}`}>
                        <registrationStatus.icon className="h-5 w-5" />
                        <span className="font-medium">{registrationStatus.text}</span>
                      </div>
                      {ticket && (
                        <Button
                          className="w-full"
                          onClick={() => navigate(`/my-tickets`)}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          View Ticket
                        </Button>
                      )}
                    </div>
                  ) : isEventPast ? (
                    <Button disabled className="w-full">
                      Event Ended
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={handleRegister}>
                      {event.is_paid ? 'Register Now' : 'Register for Free'}
                    </Button>
                  )}
                </div>

                {/* Team Info */}
                {event.registration_mode === 'team' && (
                  <>
                    <Separator />
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Team Event</p>
                      <p className="font-medium text-foreground">
                        {event.min_team_size} - {event.max_team_size} members
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Organizer Card */}
            {socialLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connect with Organizer</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm transition-colors"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      {event && (
        <EventRegistrationModal
          event={event}
          questions={questions}
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          onSuccess={loadEventData}
        />
      )}
    </div>
  );
}

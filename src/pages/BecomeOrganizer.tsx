import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Mail,
  Building,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  applyAsOrganizer,
  getOrganizerApplication,
  isUserOrganizer,
} from '@/services/eventsService';
import type { OrganizerApplication } from '@/types/events';

export default function BecomeOrganizer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<OrganizerApplication | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [organizationName, setOrganizationName] = useState('');
  const [organizationEmail, setOrganizationEmail] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    checkStatus();
  }, [user]);

  const checkStatus = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [organizerStatus, existingApplication] = await Promise.all([
        isUserOrganizer(user.id),
        getOrganizerApplication(user.id),
      ]);

      setIsOrganizer(organizerStatus);
      setApplication(existingApplication);

      if (organizerStatus) {
        navigate('/events/create');
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!organizationEmail.trim()) {
      toast.error('Please enter your organization email');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await applyAsOrganizer(
        user.id,
        organizationEmail,
        organizationName || undefined,
        reason || undefined
      );

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('You have already submitted an application');
        } else {
          toast.error('Failed to submit application. Please try again.');
        }
        return;
      }

      toast.success('Application submitted successfully!');
      checkStatus();
    } catch (error) {
      console.error('Application error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusContent = () => {
    if (!application) return null;

    switch (application.status) {
      case 'pending':
        return (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Application Under Review
              </h3>
              <p className="text-muted-foreground">
                Your organizer application is being reviewed by our team.
                You'll be notified once a decision is made.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Submitted on{' '}
                {new Date(application.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        );

      case 'approved':
        return (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                You're an Organizer!
              </h3>
              <p className="text-muted-foreground mb-4">
                Your application has been approved. You can now create events.
              </p>
              <Button onClick={() => navigate('/events/create')}>
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        );

      case 'rejected':
        return (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Application Not Approved
              </h3>
              <p className="text-muted-foreground">
                Unfortunately, your application was not approved at this time.
                Please contact support if you have questions.
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onAuthClick={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAuthClick={() => {}} />

      <main className="flex-1 container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/events')}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        {application ? (
          getStatusContent()
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Become an Event Organizer</CardTitle>
              <CardDescription>
                Apply to become an event organizer and start hosting events on UniVoid.
                Once approved, you'll have access to the Organizer Dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="organizationEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Organization Email *
                  </Label>
                  <Input
                    id="organizationEmail"
                    type="email"
                    value={organizationEmail}
                    onChange={(e) => setOrganizationEmail(e.target.value)}
                    placeholder="your@organization.edu"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use an official or verifiable email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Organization/Club Name (Optional)
                  </Label>
                  <Input
                    id="organizationName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g., Tech Club, Cultural Society"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Why do you want to become an organizer? (Optional)
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us about the events you plan to organize..."
                    rows={4}
                  />
                </div>

                <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                  <h4 className="font-medium text-foreground mb-2">
                    As an Event Organizer, you can:
                  </h4>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Create and manage events</li>
                    <li>Accept registrations and payments</li>
                    <li>Generate tickets with QR codes</li>
                    <li>Track attendance in real-time</li>
                    <li>Send updates to registered users</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

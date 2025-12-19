import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  registerForEvent,
  uploadPaymentScreenshot,
} from '@/services/eventsService';
import type { Event, EventCustomQuestion } from '@/types/events';

interface EventRegistrationModalProps {
  event: Event;
  questions: EventCustomQuestion[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EventRegistrationModal({
  event,
  questions,
  open,
  onOpenChange,
  onSuccess,
}: EventRegistrationModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'info' | 'payment' | 'complete'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);

  const isTeamEvent = event.registration_mode === 'team';

  const handleAnswerChange = (questionId: string, value: string) => {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateInfo = () => {
    // Validate team name for team events
    if (isTeamEvent && !teamName.trim()) {
      toast.error('Please enter your team name');
      return false;
    }

    // Validate required custom questions
    for (const question of questions) {
      if (question.is_required && !customAnswers[question.id]?.trim()) {
        toast.error(`Please answer: ${question.question}`);
        return false;
      }
    }

    // Validate terms acceptance
    if ((event.rules || event.terms_conditions) && !acceptedTerms) {
      toast.error('Please accept the event rules and terms');
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateInfo()) return;

    if (event.is_paid) {
      setStep('payment');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      let screenshotUrl: string | undefined;

      // Upload payment screenshot if paid event
      if (event.is_paid && paymentScreenshot) {
        const { url, error: uploadError } = await uploadPaymentScreenshot(
          paymentScreenshot,
          user.id
        );
        if (uploadError || !url) {
          toast.error('Failed to upload payment screenshot');
          return;
        }
        screenshotUrl = url;
      }

      const { id, error } = await registerForEvent(
        event.id,
        user.id,
        isTeamEvent ? teamName : undefined,
        Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
        screenshotUrl
      );

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('You are already registered for this event');
        } else {
          toast.error('Failed to register. Please try again.');
        }
        return;
      }

      setStep('complete');
      onSuccess();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('info');
    setTeamName('');
    setCustomAnswers({});
    setAcceptedTerms(false);
    setPaymentScreenshot(null);
    setPaymentPreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {step === 'info' && (
          <>
            <DialogHeader>
              <DialogTitle>Register for Event</DialogTitle>
              <DialogDescription>
                {event.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Team Name for team events */}
              {isTeamEvent && (
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Team size: {event.min_team_size} - {event.max_team_size} members
                  </p>
                </div>
              )}

              {/* Custom Questions */}
              {questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id}>
                    {question.question}
                    {question.is_required && ' *'}
                  </Label>
                  <Textarea
                    id={question.id}
                    value={customAnswers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer"
                    rows={2}
                  />
                </div>
              ))}

              {/* Terms & Conditions */}
              {(event.rules || event.terms_conditions) && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I have read and accept the event rules and terms & conditions
                  </Label>
                </div>
              )}

              {/* Price Info */}
              {event.is_paid && (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Registration Fee</p>
                  <p className="text-2xl font-bold text-foreground">₹{event.ticket_price}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleContinue} className="flex-1">
                {event.is_paid ? 'Continue to Payment' : 'Register'}
              </Button>
            </div>
          </>
        )}

        {step === 'payment' && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                Scan the QR code or use UPI to pay ₹{event.ticket_price}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* QR Code */}
              {event.organizer_qr_image_url && (
                <div className="flex justify-center">
                  <img
                    src={event.organizer_qr_image_url}
                    alt="Payment QR Code"
                    className="w-48 h-48 object-contain rounded-lg border"
                  />
                </div>
              )}

              {/* UPI ID */}
              {event.organizer_upi_id && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">UPI ID</p>
                  <p className="font-mono text-foreground select-all">
                    {event.organizer_upi_id}
                  </p>
                </div>
              )}

              {/* Upload Screenshot */}
              <div className="space-y-2">
                <Label>Upload Payment Screenshot *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {paymentPreview ? (
                    <div className="space-y-2">
                      <img
                        src={paymentPreview}
                        alt="Payment screenshot"
                        className="max-h-40 mx-auto rounded"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPaymentScreenshot(null);
                          setPaymentPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentFileChange}
                        className="hidden"
                      />
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload screenshot
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  Your registration will be confirmed once the organizer verifies your payment.
                  This usually takes 24-48 hours.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('info')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !paymentScreenshot}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'complete' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-green-500">
                Registration Successful! 🎉
              </DialogTitle>
            </DialogHeader>

            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <p className="text-muted-foreground">
                {event.is_paid
                  ? 'Your registration is pending payment verification. You will receive your ticket once the payment is approved.'
                  : 'You are now registered for this event! Your ticket is ready.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={() => navigate('/my-tickets')} className="flex-1">
                View My Tickets
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

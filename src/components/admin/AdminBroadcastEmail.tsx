import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Loader2, CheckCircle, AlertCircle, Users, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const AdminBroadcastEmail = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; sent?: number; failed?: number } | null>(null);

  // Fetch total user count
  const { data: totalUsers } = useQuery({
    queryKey: ['total-users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_disabled', false);
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch email logs
  const { data: emailLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('sender_type', 'admin')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const handleSend = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!subject.trim() || !title.trim() || !message.trim()) {
      toast.error('Please fill in subject, title, and message');
      return;
    }

    setShowConfirmDialog(false);
    setIsSending(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-broadcast-email', {
        body: {
          subject: subject.trim(),
          title: title.trim(),
          message: message.trim(),
          ctaText: ctaText.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
          adminKey: 'UNIVOID_BROADCAST_2025',
          senderId: user.id, // For logging
        },
      });

      if (error) throw error;

      if (data?.success || data?.sent > 0) {
        setLastResult({
          success: true,
          message: `Broadcast complete!`,
          sent: data.sent,
          failed: data.failed,
        });
        toast.success(`Email sent to ${data.sent} users`);
        // Clear form on success
        setSubject('');
        setTitle('');
        setMessage('');
        setCtaText('');
        setCtaUrl('');
        // Refresh logs
        refetchLogs();
      } else {
        throw new Error(data?.error || 'Failed to send broadcast');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error sending broadcast:', error);
      setLastResult({
        success: false,
        message: errorMessage,
      });
      toast.error(`Failed: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const isFormValid = subject.trim().length > 0 && title.trim().length > 0 && message.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Global Email Broadcast
          </CardTitle>
          <CardDescription>
            Send a custom announcement email to all users on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              This email will be sent to <strong className="text-foreground">{totalUsers ?? '...'}</strong> users
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="broadcast-subject">Email Subject *</Label>
              <Input
                id="broadcast-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., 🎉 Exciting Updates from UniVoid"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Banner Title *</Label>
              <Input
                id="broadcast-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., New Features Available!"
                maxLength={80}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Message *</Label>
            <Textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement here...&#10;&#10;Each paragraph will be displayed separately."
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="broadcast-cta-text">Button Text (optional)</Label>
              <Input
                id="broadcast-cta-text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g., Explore Now"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="broadcast-cta-url">Button URL (optional)</Label>
              <Input
                id="broadcast-cta-url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://univoid.tech/..."
              />
            </div>
          </div>

          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isSending || !isFormValid}
            className="w-full gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending to all users...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Broadcast to {totalUsers ?? '...'} Users
              </>
            )}
          </Button>

          {lastResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg ${
                lastResult.success
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {lastResult.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p>{lastResult.message}</p>
                {lastResult.sent !== undefined && (
                  <p className="text-xs mt-1 opacity-80">
                    Sent: {lastResult.sent}, Failed: {lastResult.failed || 0}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Email History
          </CardTitle>
          <CardDescription>
            Last 10 broadcast emails sent from admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailLogs && emailLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {log.subject}
                      </TableCell>
                      <TableCell>{log.recipients_count}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.sent_at ? format(new Date(log.sent_at), 'MMM d, h:mm a') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              No broadcast emails sent yet
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Broadcast</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to send this email to <strong>{totalUsers}</strong> users?
              </p>
              <p className="text-sm">
                <strong>Subject:</strong> {subject}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⚠️ This action cannot be undone. Make sure your content is correct.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Yes, Send to All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Send, Loader2, CheckCircle, AlertCircle, Users, History, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

type AudienceType = 'all' | 'registered' | 'non-registered';

export const AdminBroadcastEmail = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [audienceType, setAudienceType] = useState<AudienceType>('all');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; sent?: number; failed?: number } | null>(null);

  // Fetch user counts based on registration status
  const { data: userCounts } = useQuery({
    queryKey: ['user-counts-by-registration'],
    queryFn: async () => {
      // Get all active users
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_disabled', false);
      
      if (profilesError) throw profilesError;
      
      // Get users who have registered for at least one event
      const { data: registeredUsers, error: regError } = await supabase
        .from('event_registrations')
        .select('user_id')
        .not('user_id', 'is', null);
      
      if (regError) throw regError;
      
      const registeredUserIds = new Set(registeredUsers?.map(r => r.user_id) || []);
      const totalUsers = allProfiles?.length || 0;
      const registeredCount = registeredUserIds.size;
      const nonRegisteredCount = totalUsers - registeredCount;
      
      return {
        total: totalUsers,
        registered: registeredCount,
        nonRegistered: nonRegisteredCount,
      };
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

  const getAudienceCount = () => {
    if (!userCounts) return '...';
    switch (audienceType) {
      case 'all': return userCounts.total;
      case 'registered': return userCounts.registered;
      case 'non-registered': return userCounts.nonRegistered;
    }
  };

  const getAudienceLabel = () => {
    switch (audienceType) {
      case 'all': return 'All Users';
      case 'registered': return 'Registered Users (event attendees)';
      case 'non-registered': return 'Non-Registered Users (never attended events)';
    }
  };

  const handleSend = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    setShowConfirmDialog(false);
    setIsSending(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-broadcast-email', {
        body: {
          subject: subject.trim(),
          message: message.trim(),
          audienceType,
          adminKey: 'UNIVOID_BROADCAST_2025',
          senderId: user.id,
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
        setMessage('');
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

  const isFormValid = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Custom Email Broadcast
          </CardTitle>
          <CardDescription>
            Send fully custom emails to specific user groups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Audience Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Audience</Label>
            <RadioGroup
              value={audienceType}
              onValueChange={(val) => setAudienceType(val as AudienceType)}
              className="grid gap-3 sm:grid-cols-3"
            >
              <Label
                htmlFor="audience-all"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  audienceType === 'all' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="all" id="audience-all" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">All Users</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userCounts?.total ?? '...'} users
                  </p>
                </div>
              </Label>
              
              <Label
                htmlFor="audience-registered"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  audienceType === 'registered' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="registered" id="audience-registered" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Registered</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userCounts?.registered ?? '...'} attendees
                  </p>
                </div>
              </Label>
              
              <Label
                htmlFor="audience-non-registered"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  audienceType === 'non-registered' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="non-registered" id="audience-non-registered" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Non-Registered</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userCounts?.nonRegistered ?? '...'} users
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-subject">Email Subject *</Label>
            <Input
              id="broadcast-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., 🎉 Special Announcement from UniVoid"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-message">Email Body (HTML supported) *</Label>
            <Textarea
              id="broadcast-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your complete email content here...&#10;&#10;You can use HTML tags like <b>bold</b>, <i>italic</i>, <a href='url'>links</a>, etc.&#10;&#10;Line breaks will be preserved."
              rows={10}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Tip: Use HTML for formatting. Available placeholders: {`{{userName}}`} for recipient's name.
            </p>
          </div>

          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isSending || !isFormValid}
            className="w-full gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending emails...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {getAudienceCount()} {audienceType === 'all' ? 'Users' : audienceType === 'registered' ? 'Attendees' : 'Users'}
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
                Are you sure you want to send this email to <strong>{getAudienceCount()}</strong> users?
              </p>
              <p className="text-sm">
                <strong>Audience:</strong> {getAudienceLabel()}
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
              {isSending ? 'Sending...' : 'Yes, Send Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
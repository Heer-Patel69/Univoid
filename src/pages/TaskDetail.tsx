import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, Clock, IndianRupee, FileText, AlertTriangle, 
  User, Check, X, Trash2, Loader2, MessageSquare, Phone, Mail
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  TaskRequest, 
  TaskBid,
  TASK_TYPE_LABELS,
  getTaskBids,
  acceptBid,
  completeTask,
  deleteTaskRequest,
  getContactInfo
} from "@/services/taskPlazaService";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import { Helmet } from "react-helmet";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [task, setTask] = useState<TaskRequest | null>(null);
  const [bids, setBids] = useState<TaskBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [processingBidId, setProcessingBidId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactInfo, setContactInfo] = useState<{ mobile_number?: string; email?: string } | null>(null);

  const isOwner = user && task?.requester_id === user.id;
  const isAssigned = user && task?.assigned_to === user.id;

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId, user]);

  const loadTask = async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    try {
      // Fetch task
      const { data: taskData, error } = await supabase
        .from('task_requests')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      
      const taskWithMeta = {
        ...taskData,
        is_urgent: taskData.deadline ? new Date(taskData.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000) : false
      } as TaskRequest;
      
      setTask(taskWithMeta);

      // Load bids if owner
      if (user && taskData.requester_id === user.id) {
        const bidsData = await getTaskBids(taskId);
        setBids(bidsData);
      }

      // Load contact info if assigned
      if (user && taskData.assigned_to === user.id) {
        const contact = await getContactInfo(taskData.requester_id);
        setContactInfo(contact);
      }
    } catch (error) {
      console.error('Failed to load task:', error);
      toast.error('Task not found');
      navigate('/tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBid = async (bid: TaskBid) => {
    if (!task) return;
    
    setProcessingBidId(bid.id);
    try {
      const { error } = await acceptBid(bid.id, task.id, bid.solver_id);
      if (error) throw error;
      
      toast.success('Bid accepted! Contact info shared.');
      loadTask();
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept bid');
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleComplete = async () => {
    if (!task) return;
    
    setProcessingBidId('complete');
    try {
      const { error } = await completeTask(task.id);
      if (error) throw error;
      
      toast.success('Task marked as completed!');
      loadTask();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete task');
    } finally {
      setProcessingBidId(null);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    setIsDeleting(true);
    try {
      const { error } = await deleteTaskRequest(task.id);
      if (error) throw error;
      
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        <main className="flex-1 py-8">
          <div className="container-wide max-w-3xl">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{task.title} - Task Plaza | UniVoid</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => setShowAuthModal(true)} />
        
        <main className="flex-1 py-8">
          <div className="container-wide max-w-3xl">
            {/* Back button */}
            <Link to="/tasks" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Tasks
            </Link>

            {/* Task Card */}
            <Card className={`mb-6 ${task.is_urgent ? 'border-l-4 border-l-destructive' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="outline">
                    {TASK_TYPE_LABELS[task.task_type]}
                  </Badge>
                  <Badge variant={
                    task.status === 'completed' ? 'default' :
                    task.status === 'assigned' ? 'secondary' : 'outline'
                  }>
                    {task.status}
                  </Badge>
                  {task.is_urgent && (
                    <Badge variant="destructive" className="animate-pulse">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{task.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {task.description && (
                  <p className="text-muted-foreground">{task.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {task.subject && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{task.subject}</span>
                    </div>
                  )}
                  {task.page_count && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{task.page_count} pages</span>
                    </div>
                  )}
                  {task.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Due {format(new Date(task.deadline), 'PPP')}</span>
                    </div>
                  )}
                  {task.budget && (
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-muted-foreground" />
                      <span>₹{task.budget} {task.is_negotiable && '(Negotiable)'}</span>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {task.attachment_urls && task.attachment_urls.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {task.attachment_urls.map((url, i) => (
                        <a 
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner Actions */}
                {isOwner && task.status === 'open' && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Task
                    </Button>
                  </div>
                )}

                {isOwner && task.status === 'assigned' && (
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleComplete}
                      disabled={processingBidId === 'complete'}
                    >
                      {processingBidId === 'complete' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Mark as Completed
                    </Button>
                  </div>
                )}

                {/* Assigned user contact info */}
                {isAssigned && contactInfo && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Requester Contact:</p>
                    <div className="space-y-2">
                      {contactInfo.mobile_number && (
                        <a 
                          href={`tel:${contactInfo.mobile_number}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Phone className="w-4 h-4" />
                          {contactInfo.mobile_number}
                        </a>
                      )}
                      {contactInfo.email && (
                        <a 
                          href={`mailto:${contactInfo.email}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          {contactInfo.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bids Section - Only for owner */}
            {isOwner && task.status === 'open' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Bids ({bids.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bids.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No bids yet. Check back later!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {bids.map((bid) => (
                        <div key={bid.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                          <Avatar>
                            <AvatarFallback>
                              {bid.solver_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{bid.solver_name || 'Anonymous'}</p>
                            {bid.solver_xp !== undefined && (
                              <p className="text-xs text-muted-foreground">XP: {bid.solver_xp}</p>
                            )}
                            {bid.message && (
                              <p className="text-sm text-muted-foreground mt-1">{bid.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptBid(bid)}
                            disabled={!!processingBidId}
                          >
                            {processingBidId === bid.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All bids will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default TaskDetail;

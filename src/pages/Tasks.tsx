import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Briefcase, Clock, IndianRupee, FileText, 
  AlertTriangle, Hand
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getOpenTasks, 
  getMyTaskRequests,
  getMyAssignedTasks,
  TaskRequest, 
  TASK_TYPE_LABELS,
  hasExistingBid,
  createBid
} from "@/services/taskPlazaService";
import SEOHead from "@/components/common/SEOHead";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useSkeletonSync } from "@/hooks/useSkeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface LayoutContext {
  onAuthClick?: () => void;
}

const Tasks = () => {
  const { user } = useAuth();
  const context = useOutletContext<LayoutContext>();
  
  const [openTasks, setOpenTasks] = useState<TaskRequest[]>([]);
  const [myRequests, setMyRequests] = useState<TaskRequest[]>([]);
  const [myAssigned, setMyAssigned] = useState<TaskRequest[]>([]);
  const [rawLoading, setRawLoading] = useState(true);
  const [bidTask, setBidTask] = useState<TaskRequest | null>(null);
  const [bidMessage, setBidMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use skeleton sync for consistent loading behavior
  const isLoading = useSkeletonSync(rawLoading, { minDisplayTime: 400 });

  useEffect(() => {
    loadTasks();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel('tasks-page-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'task_requests' },
        (payload: any) => {
          const newData = payload.new as TaskRequest;
          
          if (payload.eventType === 'INSERT' && newData?.status === 'open') {
            setOpenTasks(prev => {
              if (prev.some(t => t.id === newData.id)) return prev;
              return [newData, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            if (newData?.status === 'open') {
              setOpenTasks(prev => prev.map(t => 
                t.id === newData.id ? { ...t, ...newData } : t
              ));
            } else {
              setOpenTasks(prev => prev.filter(t => t.id !== newData.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setOpenTasks(prev => prev.filter(t => t.id !== payload.old?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadTasks = async () => {
    setRawLoading(true);
    try {
      const open = await getOpenTasks();
      setOpenTasks(open);
      
      if (user) {
        const [requests, assigned] = await Promise.all([
          getMyTaskRequests(),
          getMyAssignedTasks()
        ]);
        setMyRequests(requests);
        setMyAssigned(assigned);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setRawLoading(false);
    }
  };

  const handleBid = async () => {
    if (!bidTask) return;
    
    setIsSubmitting(true);
    try {
      const hasBid = await hasExistingBid(bidTask.id);
      if (hasBid) {
        toast.error("You've already bid on this task");
        setBidTask(null);
        return;
      }

      const { error } = await createBid(bidTask.id, bidMessage);
      if (error) throw error;

      toast.success("Your bid has been submitted!");
      setBidTask(null);
      setBidMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TaskSkeleton = () => (
    <Card className="border-border">
      <CardContent className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );

  const TaskCard = ({ task, showBidButton = false }: { task: TaskRequest; showBidButton?: boolean }) => (
    <Card className={`border-border h-full flex flex-col ${task.is_urgent ? 'border-l-4 border-l-destructive' : ''}`}>
      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {TASK_TYPE_LABELS[task.task_type]}
          </Badge>
          {task.is_urgent && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Urgent
            </Badge>
          )}
        </div>
        
        <h3 className="font-medium text-foreground mb-2 line-clamp-2">{task.title}</h3>
        
        <div className="text-sm text-muted-foreground space-y-1 mb-3 flex-1">
          {task.subject && (
            <p className="flex items-center gap-1">
              <FileText className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{task.subject} {task.page_count && `• ${task.page_count} pg`}</span>
            </p>
          )}
          {task.deadline && (
            <p className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border/50">
          {task.budget ? (
            <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
              <IndianRupee className="w-3 h-3" />
              {task.budget}
              {task.is_negotiable && " (N)"}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">No budget set</span>
          )}
          
          {showBidButton ? (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                if (!user) {
                  context?.onAuthClick?.();
                  return;
                }
                setBidTask(task);
              }}
              className="gap-1"
            >
              <Hand className="w-3 h-3" />
              Bid
            </Button>
          ) : (
            task.status && (
              <Badge variant={
                task.status === 'completed' ? 'default' :
                task.status === 'assigned' ? 'secondary' : 'outline'
              } className="text-xs">
                {task.status}
              </Badge>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <SEOHead
        title="Task Plaza - Get Help with Assignments"
        description="A marketplace where students can help each other with assignments, manuals, and presentations. Post tasks, bid on work, and earn while helping fellow students."
        url="/tasks"
        keywords={['task plaza', 'student assignments', 'college help', 'earn money', 'freelance students', 'UniVoid']}
      />

      <div className="py-8">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-primary" />
                  Task Plaza
                </h1>
                <p className="text-muted-foreground mt-1">
                  Help others or get help with your work
                </p>
              </div>
              
              {user ? (
                <Link to="/tasks/create">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Post a Need
                  </Button>
                </Link>
              ) : (
                <Button className="gap-2" onClick={context?.onAuthClick}>
                  <Plus className="w-4 h-4" />
                  Post a Need
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList>
              <TabsTrigger value="browse">Browse Tasks</TabsTrigger>
              {user && (
                <>
                  <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                  <TabsTrigger value="my-work">My Work</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="browse" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <TaskSkeleton key={i} />
                  ))}
                </div>
              ) : openTasks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No tasks available
                    </h3>
                    <p className="text-muted-foreground">
                      Check back later for new tasks
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 staggered-grid-fast">
                  {openTasks.map((task) => (
                    <TaskCard key={task.id} task={task} showBidButton />
                  ))}
                </div>
              )}
            </TabsContent>

            {user && (
              <>
                <TabsContent value="my-requests" className="mt-0">
                  {myRequests.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          No task requests yet
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Post a task to get help from others
                        </p>
                        <Link to="/tasks/create">
                          <Button>Post a Need</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myRequests.map((task) => (
                        <Link key={task.id} to={`/tasks/${task.id}`}>
                          <TaskCard task={task} />
                        </Link>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="my-work" className="mt-0">
                  {myAssigned.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-12 text-center">
                        <Hand className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          No assigned work
                        </h3>
                        <p className="text-muted-foreground">
                          Bid on tasks to start earning
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myAssigned.map((task) => (
                        <Link key={task.id} to={`/tasks/${task.id}`}>
                          <TaskCard task={task} />
                        </Link>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      {/* Bid Dialog */}
      <Dialog open={!!bidTask} onOpenChange={() => setBidTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Your Bid</DialogTitle>
            <DialogDescription>
              Let the requester know why you're the right person for this task
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Task:</p>
              <p className="text-sm text-muted-foreground">{bidTask?.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Your message (optional)</label>
              <Textarea
                placeholder="Introduce yourself and explain why you can help..."
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBidTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleBid} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </>
  );
};

export default Tasks;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createTaskRequest, TaskType, TASK_TYPE_LABELS } from "@/services/taskPlazaService";
import { toast } from "sonner";
import { Helmet } from "react-helmet";
import { Navigate } from "react-router-dom";

const CreateTask = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [taskType, setTaskType] = useState<TaskType>("handwritten_manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [pageCount, setPageCount] = useState<number | undefined>();
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState<number | undefined>();
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return <Navigate to="/tasks" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await createTaskRequest({
        task_type: taskType,
        title: title.trim(),
        description: description.trim() || undefined,
        subject: subject.trim() || undefined,
        page_count: pageCount,
        deadline: deadline || undefined,
        budget,
        is_negotiable: isNegotiable,
      });

      if (error) throw error;

      toast.success("Task posted successfully!");
      navigate("/tasks");
    } catch (error: any) {
      toast.error(error.message || "Failed to post task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Post a Need | Task Plaza - UniVoid</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header onAuthClick={() => {}} />
        
        <main className="flex-1 py-8">
          <div className="container-wide max-w-2xl">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Post a Task</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your identity will be hidden until someone accepts your task
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Task Type *</Label>
                    <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Need Physics Lab Manual written"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Details</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide more details about what you need..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="e.g., Physics, Chemistry"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pageCount">Page Count</Label>
                      <Input
                        id="pageCount"
                        type="number"
                        min={1}
                        placeholder="e.g., 15"
                        value={pageCount || ""}
                        onChange={(e) => setPageCount(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min={0}
                      placeholder="e.g., 200"
                      value={budget || ""}
                      onChange={(e) => setBudget(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="negotiable" className="cursor-pointer">
                      Price is negotiable
                    </Label>
                    <Switch
                      id="negotiable"
                      checked={isNegotiable}
                      onCheckedChange={setIsNegotiable}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Task"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CreateTask;

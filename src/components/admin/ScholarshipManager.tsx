import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Check, X, Trash2, Loader2, Plus, ExternalLink, 
  GraduationCap, RefreshCw, Calendar, Edit2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePendingScholarships } from "@/hooks/useRealtimeScholarships";

interface Scholarship {
  id: string;
  title: string;
  description: string | null;
  source_name: string;
  source_url: string | null;
  application_link: string | null;
  deadline: string | null;
  deadline_status: string;
  eligible_states: string[];
  is_all_india: boolean;
  eligible_courses: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface ScholarshipFormData {
  title: string;
  description: string;
  source_name: string;
  source_url: string;
  application_link: string;
  deadline: string;
  is_all_india: boolean;
  eligible_states: string;
  eligible_courses: string;
}

const emptyForm: ScholarshipFormData = {
  title: "",
  description: "",
  source_name: "",
  source_url: "",
  application_link: "",
  deadline: "",
  is_all_india: true,
  eligible_states: "",
  eligible_courses: "UG, PG",
};

export default function ScholarshipManager() {
  const [allScholarships, setAllScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [formData, setFormData] = useState<ScholarshipFormData>(emptyForm);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const { scholarships: pendingScholarships, approve, reject, refetch: refetchPending } = usePendingScholarships();

  const fetchAllScholarships = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("scholarships")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load scholarships");
      console.error(error);
    } else {
      setAllScholarships(data as Scholarship[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllScholarships();

    // Real-time subscription
    const channel = supabase
      .channel("admin-scholarships")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scholarships" },
        () => fetchAllScholarships()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSyncScholarships = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-india-scholarships");
      if (error) throw error;
      toast.success(`Synced: ${data.inserted} new, ${data.updated} updated`);
      setLastSyncedAt(new Date().toISOString());
      // Force refetch both lists
      await fetchAllScholarships();
      refetchPending();
    } catch (error) {
      console.error(error);
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approve(id);
      toast.success("Scholarship approved");
    } catch {
      toast.error("Failed to approve");
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await reject(id, "Rejected by admin");
      toast.success("Scholarship rejected");
    } catch {
      toast.error("Failed to reject");
    }
    setProcessingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scholarship?")) return;
    setProcessingId(id);
    const { error } = await supabase.from("scholarships").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted");
      setAllScholarships(prev => prev.filter(s => s.id !== id));
    }
    setProcessingId(null);
  };

  const handleAddOrEdit = async () => {
    if (!formData.title || !formData.source_name) {
      toast.error("Title and source name are required");
      return;
    }

    setProcessingId("form");

    const scholarshipData = {
      title: formData.title,
      description: formData.description || null,
      source_name: formData.source_name,
      source_url: formData.source_url || null,
      application_link: formData.application_link || null,
      deadline: formData.deadline || null,
      deadline_status: formData.deadline ? "active" : null,
      is_all_india: formData.is_all_india,
      eligible_states: formData.eligible_states 
        ? formData.eligible_states.split(",").map(s => s.trim()) 
        : [],
      eligible_courses: formData.eligible_courses 
        ? formData.eligible_courses.split(",").map(s => s.trim()) 
        : [],
      status: "approved",
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingScholarship) {
      ({ error } = await supabase
        .from("scholarships")
        .update(scholarshipData)
        .eq("id", editingScholarship.id));
    } else {
      ({ error } = await supabase.from("scholarships").insert(scholarshipData));
    }

    if (error) {
      toast.error("Failed to save");
      console.error(error);
    } else {
      toast.success(editingScholarship ? "Updated" : "Added");
      setShowAddDialog(false);
      setEditingScholarship(null);
      setFormData(emptyForm);
      fetchAllScholarships();
    }
    setProcessingId(null);
  };

  const openEditDialog = (scholarship: Scholarship) => {
    setEditingScholarship(scholarship);
    setFormData({
      title: scholarship.title,
      description: scholarship.description || "",
      source_name: scholarship.source_name,
      source_url: scholarship.source_url || "",
      application_link: scholarship.application_link || "",
      deadline: scholarship.deadline || "",
      is_all_india: scholarship.is_all_india,
      eligible_states: scholarship.eligible_states?.join(", ") || "",
      eligible_courses: scholarship.eligible_courses?.join(", ") || "",
    });
    setShowAddDialog(true);
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingScholarship(null);
    setFormData(emptyForm);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string, deadlineStatus: string) => {
    if (deadlineStatus === "expired") {
      return <Badge variant="secondary">Expired</Badge>;
    }
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500/20 text-green-600">Active</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const approvedCount = allScholarships.filter(s => s.status === "approved" && s.deadline_status !== "expired").length;
  const expiredCount = allScholarships.filter(s => s.deadline_status === "expired").length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {approvedCount} active, {pendingScholarships.length} pending, {expiredCount} expired
            </span>
          </div>
          {lastSyncedAt && (
            <span className="text-xs text-muted-foreground">
              Last synced: {format(new Date(lastSyncedAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncScholarships} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sync Data
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Scholarship
          </Button>
        </div>
      </div>

      {/* Pending Approval Section */}
      {pendingScholarships.length > 0 && (
        <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/5">
          <h3 className="font-semibold mb-3 text-yellow-700">Pending Approval ({pendingScholarships.length})</h3>
          <div className="space-y-2">
            {pendingScholarships.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-background rounded p-3">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.source_name}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(s.id)}
                    disabled={processingId === s.id}
                  >
                    {processingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(s.id)}
                    disabled={processingId === s.id}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Scholarships Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Title</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Deadline</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allScholarships.map(scholarship => (
              <tr key={scholarship.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="p-3">
                  <div>
                    <p className="font-medium text-foreground line-clamp-1">{scholarship.title}</p>
                    <p className="text-xs text-muted-foreground">{scholarship.source_name}</p>
                  </div>
                </td>
                <td className="p-3 hidden sm:table-cell">
                  {getStatusBadge(scholarship.status, scholarship.deadline_status)}
                </td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">
                  {scholarship.deadline ? formatDate(scholarship.deadline) : "-"}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    {scholarship.application_link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(scholarship.application_link!, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(scholarship)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(scholarship.id)}
                      disabled={processingId === scholarship.id}
                    >
                      {processingId === scholarship.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScholarship ? "Edit Scholarship" : "Add Scholarship"}</DialogTitle>
            <DialogDescription>
              {editingScholarship ? "Update scholarship details" : "Add a new scholarship manually"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Scholarship title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Scholarship description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source_name">Source Name *</Label>
                <Input
                  id="source_name"
                  value={formData.source_name}
                  onChange={e => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
                  placeholder="e.g., NSP"
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="source_url">Source URL</Label>
              <Input
                id="source_url"
                value={formData.source_url}
                onChange={e => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="application_link">Application Link</Label>
              <Input
                id="application_link"
                value={formData.application_link}
                onChange={e => setFormData(prev => ({ ...prev, application_link: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_all_india}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, is_all_india: checked }))}
              />
              <Label>All India (open to all states)</Label>
            </div>

            {!formData.is_all_india && (
              <div>
                <Label htmlFor="eligible_states">Eligible States (comma-separated)</Label>
                <Input
                  id="eligible_states"
                  value={formData.eligible_states}
                  onChange={e => setFormData(prev => ({ ...prev, eligible_states: e.target.value }))}
                  placeholder="Maharashtra, Karnataka, Tamil Nadu"
                />
              </div>
            )}

            <div>
              <Label htmlFor="eligible_courses">Eligible Courses (comma-separated)</Label>
              <Input
                id="eligible_courses"
                value={formData.eligible_courses}
                onChange={e => setFormData(prev => ({ ...prev, eligible_courses: e.target.value }))}
                placeholder="UG, PG, Diploma"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleAddOrEdit} disabled={processingId === "form"}>
              {processingId === "form" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingScholarship ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

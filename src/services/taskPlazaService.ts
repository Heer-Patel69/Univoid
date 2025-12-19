import { supabase } from '@/integrations/supabase/client';

export type TaskType = 'handwritten_manual' | 'typing_assignment' | 'ppt_creation' | 'diagram_drawing' | 'other';
export type TaskStatus = 'open' | 'assigned' | 'completed' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected';

export interface TaskRequest {
  id: string;
  requester_id: string;
  task_type: TaskType;
  title: string;
  description: string | null;
  subject: string | null;
  page_count: number | null;
  deadline: string | null;
  budget: number | null;
  is_negotiable: boolean;
  attachment_urls: string[];
  status: TaskStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  is_urgent?: boolean;
}

export interface TaskBid {
  id: string;
  task_id: string;
  solver_id: string;
  message: string | null;
  status: BidStatus;
  created_at: string;
  solver_name?: string;
  solver_xp?: number;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  handwritten_manual: 'Handwritten Manual',
  typing_assignment: 'Typing Assignment',
  ppt_creation: 'PPT Creation',
  diagram_drawing: 'Diagram Drawing',
  other: 'Other',
};

// Get all open tasks
export async function getOpenTasks(): Promise<TaskRequest[]> {
  const { data, error } = await supabase
    .from('task_requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Calculate urgency
  const now = new Date();
  return (data || []).map(task => ({
    ...task,
    is_urgent: task.deadline ? (new Date(task.deadline).getTime() - now.getTime()) < 24 * 60 * 60 * 1000 : false,
  })) as TaskRequest[];
}

// Get my tasks (as requester)
export async function getMyTaskRequests(): Promise<TaskRequest[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('task_requests')
    .select('*')
    .eq('requester_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as TaskRequest[];
}

// Get tasks assigned to me (as solver)
export async function getMyAssignedTasks(): Promise<TaskRequest[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('task_requests')
    .select('*')
    .eq('assigned_to', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as TaskRequest[];
}

// Create a task request
export async function createTaskRequest(task: {
  task_type: TaskType;
  title: string;
  description?: string;
  subject?: string;
  page_count?: number;
  deadline?: string;
  budget?: number;
  is_negotiable?: boolean;
  attachment_urls?: string[];
}): Promise<{ data: TaskRequest | null; error: Error | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('task_requests')
    .insert({
      ...task,
      requester_id: userData.user.id,
    })
    .select()
    .single();

  return { data: data as TaskRequest, error: error as Error | null };
}

// Update task request
export async function updateTaskRequest(
  taskId: string,
  updates: Partial<TaskRequest>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('task_requests')
    .update(updates)
    .eq('id', taskId);

  return { error: error as Error | null };
}

// Delete task request
export async function deleteTaskRequest(taskId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('task_requests')
    .delete()
    .eq('id', taskId);

  return { error: error as Error | null };
}

// Get bids for a task
export async function getTaskBids(taskId: string): Promise<TaskBid[]> {
  const { data, error } = await supabase
    .from('task_bids')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) return [];

  // Enrich with solver info
  for (const bid of data || []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, total_xp')
      .eq('id', bid.solver_id)
      .single();
    
    if (profile) {
      (bid as any).solver_name = profile.full_name;
      (bid as any).solver_xp = profile.total_xp;
    }
  }

  return data as TaskBid[];
}

// Create a bid
export async function createBid(
  taskId: string,
  message?: string
): Promise<{ error: Error | null }> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('task_bids')
    .insert({
      task_id: taskId,
      solver_id: userData.user.id,
      message,
    });

  return { error: error as Error | null };
}

// Accept a bid
export async function acceptBid(
  bidId: string,
  taskId: string,
  solverId: string
): Promise<{ error: Error | null }> {
  // Update bid status
  const { error: bidError } = await supabase
    .from('task_bids')
    .update({ status: 'accepted' })
    .eq('id', bidId);

  if (bidError) return { error: bidError as Error };

  // Update task to assigned
  const { error: taskError } = await supabase
    .from('task_requests')
    .update({ status: 'assigned', assigned_to: solverId })
    .eq('id', taskId);

  if (taskError) return { error: taskError as Error };

  // Reject other bids
  await supabase
    .from('task_bids')
    .update({ status: 'rejected' })
    .eq('task_id', taskId)
    .neq('id', bidId);

  return { error: null };
}

// Get contact info (only visible after bid accepted)
export async function getContactInfo(userId: string): Promise<{
  mobile_number: string | null;
  email: string;
} | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('mobile_number, email')
    .eq('id', userId)
    .single();

  return data;
}

// Check if user has bid on task
export async function hasExistingBid(taskId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data } = await supabase
    .from('task_bids')
    .select('id')
    .eq('task_id', taskId)
    .eq('solver_id', userData.user.id)
    .maybeSingle();

  return !!data;
}

// Mark task as completed
export async function completeTask(taskId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('task_requests')
    .update({ status: 'completed' })
    .eq('id', taskId);

  return { error: error as Error | null };
}

import { supabase } from '@/integrations/supabase/client';
import type { 
  Event, 
  EventRegistration, 
  EventTicket, 
  EventCustomQuestion,
  EventUpdate,
  EventMaterial,
  OrganizerApplication,
  EventCategory,
  EventType,
  RegistrationMode
} from '@/types/events';

// Fetch approved events with pagination
export async function getEvents(
  page: number = 1,
  pageSize: number = 12,
  filters?: {
    category?: EventCategory;
    city?: string;
    search?: string;
  }
): Promise<{ data: Event[]; hasMore: boolean; total: number }> {
  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .gte('end_datetime', new Date().toISOString())
    .order('start_datetime', { ascending: true });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  // Fetch organizer names
  const events = data as Event[];
  for (const event of events) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: event.organizer_id,
    });
    event.organizer_name = nameData || 'Anonymous';
  }

  return {
    data: events,
    hasMore: (count || 0) > page * pageSize,
    total: count || 0,
  };
}

// Get single event by ID
export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  const event = data as Event;
  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: event.organizer_id,
  });
  event.organizer_name = nameData || 'Anonymous';

  return event;
}

// Get events by organizer
export async function getOrganizerEvents(organizerId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Event[];
}

// Create event
export async function createEvent(
  eventData: Omit<Event, 'id' | 'views_count' | 'registrations_count' | 'created_at' | 'updated_at' | 'organizer_name'>
): Promise<{ id: string | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select('id')
    .single();

  if (error) {
    return { id: null, error: error as Error };
  }

  return { id: data.id, error: null };
}

// Update event
export async function updateEvent(
  id: string,
  updates: Partial<Event>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id);

  return { error: error as Error | null };
}

// Delete event
export async function deleteEvent(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  return { error: error as Error | null };
}

// Get event custom questions
export async function getEventQuestions(eventId: string): Promise<EventCustomQuestion[]> {
  const { data, error } = await supabase
    .from('event_custom_questions')
    .select('*')
    .eq('event_id', eventId)
    .order('question_order', { ascending: true });

  if (error) throw error;
  return data as EventCustomQuestion[];
}

// Create custom question
export async function createEventQuestion(
  eventId: string,
  question: string,
  isRequired: boolean,
  order: number
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('event_custom_questions')
    .insert({
      event_id: eventId,
      question,
      is_required: isRequired,
      question_order: order,
    });

  return { error: error as Error | null };
}

// Register for event
export async function registerForEvent(
  eventId: string,
  userId: string,
  teamName?: string,
  customAnswers?: Record<string, string>,
  paymentScreenshotUrl?: string
): Promise<{ id: string | null; error: Error | null }> {
  // Check if event is paid
  const { data: event } = await supabase
    .from('events')
    .select('is_paid')
    .eq('id', eventId)
    .single();

  const registrationData: any = {
    event_id: eventId,
    user_id: userId,
    team_name: teamName,
    custom_answers: customAnswers,
    is_team_leader: true,
  };

  if (event?.is_paid) {
    registrationData.payment_status = 'pending';
    registrationData.payment_screenshot_url = paymentScreenshotUrl;
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .insert(registrationData)
    .select('id')
    .single();

  if (error) {
    return { id: null, error: error as Error };
  }

  return { id: data.id, error: null };
}

// Get user's registration for an event
export async function getUserRegistration(
  eventId: string,
  userId: string
): Promise<EventRegistration | null> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as EventRegistration;
}

// Get all registrations for an event (organizer view)
export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch user names
  const registrations = data as EventRegistration[];
  for (const reg of registrations) {
    const { data: nameData } = await supabase.rpc('get_contributor_name', {
      user_id: reg.user_id,
    });
    reg.user_name = nameData || 'Anonymous';
  }

  return registrations;
}

// Approve/reject payment
export async function updatePaymentStatus(
  registrationId: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('event_registrations')
    .update({
      payment_status: status,
      payment_reviewed_at: new Date().toISOString(),
      payment_notes: notes,
    })
    .eq('id', registrationId);

  return { error: error as Error | null };
}

// Get user's ticket
export async function getUserTicket(
  eventId: string,
  userId: string
): Promise<EventTicket | null> {
  const { data, error } = await supabase
    .from('event_tickets')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as EventTicket;
}

// Get all user tickets
export async function getUserTickets(userId: string): Promise<EventTicket[]> {
  const { data, error } = await supabase
    .from('event_tickets')
    .select(`
      *,
      events (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((ticket: any) => ({
    ...ticket,
    event: ticket.events,
  })) as EventTicket[];
}

// Validate QR code and check in
export async function validateAndCheckIn(
  qrCode: string,
  checkedInBy: string
): Promise<{ success: boolean; message: string; ticketData?: any }> {
  // Find ticket by QR code
  const { data: ticket, error: ticketError } = await supabase
    .from('event_tickets')
    .select('*, events(*)')
    .eq('qr_code', qrCode)
    .single();

  if (ticketError || !ticket) {
    return { success: false, message: 'Invalid QR code' };
  }

  if (ticket.status === 'used') {
    return { success: false, message: 'Ticket already used' };
  }

  if (ticket.status === 'cancelled') {
    return { success: false, message: 'Ticket has been cancelled' };
  }

  // Check if organizer owns this event
  if ((ticket as any).events.organizer_id !== checkedInBy) {
    return { success: false, message: 'Unauthorized to check in for this event' };
  }

  // Mark ticket as used
  const { error: updateError } = await supabase
    .from('event_tickets')
    .update({ status: 'used' })
    .eq('id', ticket.id);

  if (updateError) {
    return { success: false, message: 'Failed to update ticket status' };
  }

  // Create attendance record
  const { error: attendanceError } = await supabase
    .from('event_attendance')
    .insert({
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      user_id: ticket.user_id,
      checked_in_by: checkedInBy,
    });

  if (attendanceError) {
    return { success: false, message: 'Failed to record attendance' };
  }

  // Get user name
  const { data: userName } = await supabase.rpc('get_contributor_name', {
    user_id: ticket.user_id,
  });

  return {
    success: true,
    message: 'Check-in successful!',
    ticketData: {
      ...ticket,
      user_name: userName,
    },
  };
}

// Get event attendance stats
export async function getEventAttendanceStats(eventId: string): Promise<{
  total_registrations: number;
  checked_in: number;
  pending_payment: number;
}> {
  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('payment_status')
    .eq('event_id', eventId);

  const { count: checkedIn } = await supabase
    .from('event_attendance')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  return {
    total_registrations: registrations?.length || 0,
    checked_in: checkedIn || 0,
    pending_payment: registrations?.filter((r) => r.payment_status === 'pending').length || 0,
  };
}

// Create event update
export async function createEventUpdate(
  eventId: string,
  title: string,
  message: string,
  isCritical: boolean = false
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('event_updates')
    .insert({
      event_id: eventId,
      title,
      message,
      is_critical: isCritical,
    });

  return { error: error as Error | null };
}

// Get event updates
export async function getEventUpdates(eventId: string): Promise<EventUpdate[]> {
  const { data, error } = await supabase
    .from('event_updates')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as EventUpdate[];
}

// Organizer application
export async function applyAsOrganizer(
  userId: string,
  organizationEmail: string,
  organizationName?: string,
  reason?: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('organizer_applications')
    .insert({
      user_id: userId,
      organization_email: organizationEmail,
      organization_name: organizationName,
      reason,
    });

  return { error: error as Error | null };
}

// Get user's organizer application status
export async function getOrganizerApplication(
  userId: string
): Promise<OrganizerApplication | null> {
  const { data, error } = await supabase
    .from('organizer_applications')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as OrganizerApplication;
}

// Check if user is organizer
export async function isUserOrganizer(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'organizer',
  });

  if (error) return false;
  return data;
}

// Upload event banner
export async function uploadEventBanner(
  file: File,
  userId: string
): Promise<{ url: string | null; error: Error | null }> {
  const fileExt = file.name.split('.').pop();
  const filePath = `banners/${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('event-assets')
    .upload(filePath, file);

  if (uploadError) {
    return { url: null, error: uploadError as Error };
  }

  const { data } = supabase.storage
    .from('event-assets')
    .getPublicUrl(filePath);

  return { url: data.publicUrl, error: null };
}

// Upload payment screenshot
export async function uploadPaymentScreenshot(
  file: File,
  userId: string
): Promise<{ url: string | null; error: Error | null }> {
  const fileExt = file.name.split('.').pop();
  const filePath = `payments/${userId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('event-assets')
    .upload(filePath, file);

  if (uploadError) {
    return { url: null, error: uploadError as Error };
  }

  const { data } = supabase.storage
    .from('event-assets')
    .getPublicUrl(filePath);

  return { url: data.publicUrl, error: null };
}

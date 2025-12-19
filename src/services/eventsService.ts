import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  flyer_url: string | null;
  category: string;
  event_type: string;
  is_location_decided: boolean;
  venue_name: string | null;
  venue_address: string | null;
  maps_link: string | null;
  start_date: string;
  end_date: string | null;
  is_paid: boolean;
  price: number;
  upi_qr_url: string | null;
  upi_vpa: string | null;
  terms_conditions: string | null;
  custom_fields: Json;
  max_capacity: number | null;
  registrations_count: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  custom_data: Json;
  payment_screenshot_url: string | null;
  payment_status: 'pending' | 'approved' | 'rejected' | 'used';
  reviewed_at: string | null;
  team_id: string | null;
  created_at: string;
  event?: Event;
}

export interface EventTicket {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  qr_code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  event?: Event;
  registration?: EventRegistration;
}

// Fetch published events
export const fetchEvents = async (filters?: {
  category?: string;
  is_paid?: boolean;
  search?: string;
}) => {
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: true });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.is_paid !== undefined) {
    query = query.eq('is_paid', filters.is_paid);
  }
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Event[];
};

// Fetch single event
export const fetchEventById = async (id: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Event;
};

// Register for event
export const registerForEvent = async (registration: {
  event_id: string;
  user_id: string;
  custom_data?: Record<string, unknown>;
  payment_screenshot_url?: string;
}) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: registration.event_id,
      user_id: registration.user_id,
      custom_data: registration.custom_data as Json,
      payment_screenshot_url: registration.payment_screenshot_url,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EventRegistration;
};

// Check if user is registered for event
export const checkUserRegistration = async (eventId: string, userId: string) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as EventRegistration | null;
};

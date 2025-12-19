export type EventCategory = 
  | 'technology'
  | 'cultural'
  | 'sports'
  | 'placement'
  | 'workshop'
  | 'seminar'
  | 'meetup'
  | 'entrepreneurship'
  | 'social'
  | 'other';

export type EventType = 
  | 'college_event'
  | 'hackathon'
  | 'competition'
  | 'party'
  | 'seminar_workshop'
  | 'meetup'
  | 'other';

export type RegistrationMode = 'individual' | 'team';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export type TicketStatus = 'valid' | 'used' | 'cancelled';

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  rules?: string;
  terms_conditions?: string;
  banner_image_url: string;
  category: EventCategory;
  event_type: EventType;
  registration_mode: RegistrationMode;
  city: string;
  location_finalized: boolean;
  venue_name?: string;
  venue_address?: string;
  venue_landmark?: string;
  google_maps_link?: string;
  start_datetime: string;
  end_datetime: string;
  is_paid: boolean;
  ticket_price?: number;
  organizer_upi_id?: string;
  organizer_qr_image_url?: string;
  min_team_size: number;
  max_team_size: number;
  max_registrations?: number;
  organizer_instagram?: string;
  organizer_linkedin?: string;
  organizer_twitter?: string;
  organizer_facebook?: string;
  organizer_youtube?: string;
  organizer_website?: string;
  status: 'pending' | 'approved' | 'rejected';
  views_count: number;
  registrations_count: number;
  created_at: string;
  updated_at: string;
  organizer_name?: string;
}

export interface EventCustomQuestion {
  id: string;
  event_id: string;
  question: string;
  is_required: boolean;
  question_order: number;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  team_name?: string;
  is_team_leader: boolean;
  team_leader_id?: string;
  payment_status?: PaymentStatus;
  payment_screenshot_url?: string;
  payment_reviewed_at?: string;
  payment_notes?: string;
  custom_answers?: Record<string, string>;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export interface EventTicket {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  qr_code: string;
  status: TicketStatus;
  created_at: string;
  event?: Event;
}

export interface EventAttendance {
  id: string;
  ticket_id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  checked_in_by: string;
}

export interface EventMaterial {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  views_count: number;
  downloads_count: number;
  likes_count: number;
  uploaded_by: string;
  created_at: string;
}

export interface EventUpdate {
  id: string;
  event_id: string;
  title: string;
  message: string;
  is_critical: boolean;
  created_at: string;
}

export interface OrganizerApplication {
  id: string;
  user_id: string;
  organization_name?: string;
  organization_email: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  user_name?: string;
}

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'placement', label: 'Placement' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'social', label: 'Social/NGO' },
  { value: 'other', label: 'Other' },
];

export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'college_event', label: 'College Event' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'competition', label: 'Competition' },
  { value: 'party', label: 'Party/Entertainment' },
  { value: 'seminar_workshop', label: 'Seminar/Workshop' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'other', label: 'Other' },
];

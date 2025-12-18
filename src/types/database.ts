// Database types for UniVoid

export type ContentStatus = 'pending' | 'approved' | 'rejected';
export type AppRole = 'admin' | 'student';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  college_name: string;
  course_stream: string;
  year_semester: string;
  mobile_number: string | null;
  profile_photo_url: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  // New fields
  course: string | null;
  branch: string | null;
  subject: string | null;
  language: string | null;
  college: string | null;
  // Joined data
  contributor_name?: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  contributor_name?: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  image_urls: string[];
  external_link: string | null;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  contributor_name?: string;
}

export interface Book {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  condition: string | null;
  image_urls: string[];
  seller_mobile: string;
  seller_address: string;
  seller_email: string;
  is_sold: boolean;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  contributor_name?: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  content_type: string | null;
  content_id: string | null;
  created_at: string;
}

// XP values
export const XP_VALUES = {
  material_approved: 50,
  blog_approved: 30,
  news_approved: 10,
  book_listed: 20,
  book_sold: 40,
} as const;

// Blocked video formats
export const BLOCKED_VIDEO_FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];

// Calculate user level from XP
export function calculateLevel(xp: number): number {
  // Every 200 XP = 1 level
  return Math.floor(xp / 200) + 1;
}

// Public profile (what's shown to others)
export interface PublicProfile {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  total_xp: number;
  level: number;
  rank?: number;
  materials_count: number;
  blogs_count: number;
  news_count: number;
  books_count: number;
}

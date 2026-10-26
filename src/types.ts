export interface EventSettings {
  id: number;
  event_title: string;
  event_subtitle: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_maps_url: string;
  dress_code: string;
  script_edition: string;
  storyteller_name: string;
  max_capacity: number;
  riddle_question: string;
  riddle_option_a: string;
  riddle_option_b: string;
  riddle_option_c: string;
  riddle_correct_option: 'A' | 'B' | 'C';
  updated_at: string;
}

export interface GuestRecord {
  id: number;
  slug: string;
  invite_code: string;
  name: string;
  phone: string;
  email: string;
  status: 'confirmed' | 'pending' | 'declined';
  plus_ones: number;
  assigned_role: string;
  subscribed_updates: boolean;
  riddle_solved: boolean;
  responded_at: string | null;
  created_at: string;
}

export interface EmailBroadcastRecord {
  id: number;
  subject: string;
  audience: string;
  template_type: string;
  body_text: string;
  recipients_count: number;
  recipients_list: string;
  delivery_status: string;
  sent_at: string;
  preview_html?: string;
}

export type ActiveTab = 'invitation' | 'roles' | 'guests' | 'emails';

export interface Contact {
  contact_id: number;
  user_id: string;
  phone: string;
  name: string | null;
  status: 'WHITE' | 'BLACK';
  notes: string | null;
  created_at: string;
  updated_at: string;
}
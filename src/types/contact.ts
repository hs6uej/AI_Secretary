// src/types/contact.ts

// ประเภท ContactStatus จาก n8n_j.n8n_caller_status enum
export type ContactStatus = 'BLACKLISTED' | 'WHITELISTED' | 'UNKNOWN';

export interface Contact {
  user_id: string;
  caller_number: string; // Primary key part 2
  caller_name: string | null;
  status: ContactStatus;
  notes: string | null; // caller_note
  created_at: string;
  updated_at: string;
  // เพิ่ม contact_id ถ้าจำเป็นต้องใช้ unique key ใน frontend ที่ไม่ใช่ composite key
  // contact_id?: string; // อาจจะสร้างขึ้นเองใน frontend หรือใช้ user_id + caller_number
}
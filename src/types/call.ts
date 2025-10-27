// src/types/call.ts

// ประเภท CallType จาก n8n_j.n8n_calltype_enum
export type CallType = 'Incoming' | 'Missed' | 'Outgoing';

// ประเภท CallStatus จาก n8n_j.n8n_call_history.status (เป็น text)
// อาจจะต้องปรับปรุงตามค่าที่เป็นไปได้จริงในตาราง
export type CallStatus = string | 'completed' | 'failed' | 'processing' | 'in_progress' | 'ended' | 'scheduled' | 'declined_spam'; // เพิ่มค่าที่เป็นไปได้

// ประเภท CallCategory จาก n8n_j.n8n_call_history.category (เป็น text)
export type CallCategory = string | 'work' | 'family' | 'telesales' | 'spam' | 'info_update' | 'delivery_logistics' | 'bank_financial' | 'insurance' | 'general_appointment' | 'formal_appointment' | 'unknown_other' | 'other' | 'uncategorized'; // เพิ่มค่าที่เป็นไปได้

// SpeakerRole จาก n8n_j.n8n_chat_histories.message->>'type'
export type SpeakerRole = 'human' | 'ai'; // ปรับตามข้อมูลจริง

// Interface สำหรับข้อมูล call log หลักจาก n8n_j.n8n_call_history
export interface CallLog {
  call_id: string; // session_id (uuid) from backend response
  user_id: string;
  caller_phone: string; // caller_number
  caller_name: string | null;
  call_type: CallType; // calltype
  processing_status: CallStatus; // status
  category?: CallCategory;
  contact_status?: string; // 'BLACKLISTED', 'WHITELISTED', 'UNKNOWN' from n8n_caller join
  confidence?: number | string | null; // เป็น numeric ใน DB แต่อาจมาเป็น string
  summary?: string | null; // sms_summary_th
  created_at: string; // datetime
  // Fields เพิ่มเติมจาก n8n_call_history
  note?: string | null;
  intent?: string | null;
  spam_risk_score?: number | string | null;
  spam_risk_reason?: string | null;
  sms_summary_en?: string | null;
  call_outcome?: string | null;
  tts_response?: string | null;
  conversation_log?: string | null;
  llm_payload?: any | null;
  cursor_pk?: number; // call_id (bigint) for cursor
}

// Interface สำหรับ segment จาก n8n_j.n8n_chat_histories
export interface CallSegment {
  segment_id: number; // id from n8n_chat_histories
  speaker: SpeakerRole; // message->>'type'
  text: string | null; // message->>'content'
  // อาจเพิ่ม timestamp ถ้าต้องการดึงมาแสดง (ต้อง parse จาก message)
}

// Frontend interface for display
export interface CallDisplay {
  id: string; // session_id
  callerName: string;
  callerNumber: string;
  timestamp: string; // datetime
  type: CallType; // calltype
  status: 'answered' | 'voicemail' | 'missed' | 'blocked' | 'processing' | 'failed' | 'other'; // mapped from processing_status & call_type
  duration?: string; // ไม่มีใน schema n8n_j
  recording?: boolean; // ไม่มีใน schema n8n_j (สมมติว่ามี)
  category?: CallCategory;
  summary?: string; // sms_summary_th
}
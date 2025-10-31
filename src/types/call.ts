// src/types/call.ts

// ประเภท CallType จาก n8n_j.n8n_calltype_enum
export type CallType = 'Incoming' | 'Missed' | 'Outgoing';

// ประเภท CallStatus จาก n8n_j.n8n_call_history.status (เป็น text)
export type CallStatus = string | 'completed' | 'failed' | 'processing' | 'in_progress' | 'ended' | 'scheduled' | 'declined_spam'; 

// ประเภท CallCategory จาก n8n_j.n8n_call_history.category (เป็น text)
export type CallCategory = string | 'work' | 'family' | 'telesales' | 'spam' | 'info_update' | 'delivery_logistics' | 'bank_financial' | 'insurance' | 'general_appointment' | 'formal_appointment' | 'unknown_other' | 'other' | 'uncategorized'; 

// SpeakerRole จาก n8n_j.n8n_chat_histories.message->>'type'
export type SpeakerRole = 'human' | 'ai' | 'unknown'; // เพิ่ม unknown

// Interface สำหรับข้อมูล call log หลักจาก n8n_j.n8n_call_history
export interface CallLog {
  call_id: string; // session_id (uuid) from backend response
  user_id: string;
  caller_phone: string; // caller_number
  caller_name: string | null;
  call_type: CallType;
  processing_status: CallStatus | null; // MODIFIED: Allow null
  category: CallCategory | null; // MODIFIED: Allow null
  
  // ADDED (Case 9): เพิ่ม field ที่ map มาจาก backend
  category_description?: string;
  
  // (Case 5)
  contact_status?: string; // 'BLACKLISTED', 'WHITELISTED', 'UNKNOWN'
  
  confidence?: number | string | null; // (Case 8)
  summary?: string | null; // sms_summary_th
  created_at: string; // datetime
  
  // Fields เพิ่มเติมจาก n8n_call_history
  note?: string | null;
  intent?: string | null;
  spam_risk_score?: number | string | null; // (Case 8)
  spam_risk_reason?: string | null;
  sms_summary_en?: string | null;
  call_outcome?: string | null;
  
  // REMOVED (Case 7): ลบ field เก่าที่ Backend ไม่มีแล้ว (จากไฟล์ call.ts เดิมของคุณ)
  // tts_response?: string | null;
  
  // ADDED (Case 7): เพิ่ม field ใหม่จาก server.js (แก้ปุ่มเทา)
  voice_log?: string | null; 

  conversation_log?: string | null;
  llm_payload?: any | null;
  cursor_pk?: number; // call_id (bigint) for cursor
}

// Interfaceสำหรับ segment จาก n8n_j.n8n_chat_histories
export interface CallSegment {
  segment_id: number; // id from n8n_chat_histories
  speaker: SpeakerRole; // message->>'type'
  text: string | null; // message->>'content'
  
  // MODIFIED (Fix "วินาทีหาย"): เพิ่ม created_at (จากไฟล์ call.ts เดิมของคุณ)
  created_at: string; 
}

// ADDED (Case 7): Interface สำหรับ response เสียง
export interface AudioData {
  mimeType: string;
  data: string; // base64 string
}

// MODIFIED: Frontend interface for display (เพื่อให้ CallItem.tsx ทำงานได้)
export interface CallDisplay {
  id: string; // session_id
  callerName: string;
  callerNumber: string;
  timestamp: string; // datetime
  type: CallType;
  summary: string | null;
  status: 'answered' | 'missed' | 'blocked' | 'failed' | 'processing' | 'other';
  
  // MODIFIED (Case 7): เปลี่ยนชื่อ Field ให้สื่อความหมาย (จะถูก map จาก voice_log)
  recordingUrl: string | null; 
  
  // ADDED (Case 5, 8, 9): เพิ่ม fields สำหรับส่งให้ CallItem
  contact_status?: string;
  confidence?: number | string | null;
  spam_risk_score?: number | string | null;
  category_description?: string;
}
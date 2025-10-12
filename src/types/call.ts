export type CallType = 'incoming' | 'missed' | 'outgoing';
export type CallStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type CallCategory = 'work' | 'family' | 'telesales' | 'spam' | 'info_update' | 'delivery_logistics' | 'bank_financial' | 'insurance' | 'general_appointment' | 'formal_appointment' | 'other' | 'uncategorized';
export type SpeakerRole = 'caller' | 'receiver';
export interface CallLog {
  call_id: string;
  user_id: string;
  caller_phone: string;
  caller_name: string | null;
  call_type: CallType;
  status: CallStatus;
  category?: CallCategory;
  confidence?: number;
  summary?: string | null;
  created_at: string;
  updated_at: string;
}
export interface CallSegment {
  segment_id: number;
  call_id: string;
  start_ms: number;
  end_ms: number;
  speaker: SpeakerRole;
  text: string | null;
  confidence?: number;
}
// Frontend interface for display
export interface CallDisplay {
  id: string;
  callerName: string;
  callerNumber: string;
  timestamp: string;
  type: CallType;
  status: 'answered' | 'voicemail' | 'missed' | 'blocked';
  duration?: string;
  recording?: boolean;
  category?: CallCategory;
  summary?: string;
}
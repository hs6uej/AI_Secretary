import { CallLog, CallSegment } from '../types/call';
export const callsService = {
  getCalls: async (userId: string, filter?: string): Promise<CallLog[]> => {
    // For development/testing
    return [{
      call_id: '1',
      user_id: userId,
      caller_phone: '+66812345678',
      caller_name: 'John Smith',
      call_type: 'incoming',
      status: 'completed',
      category: 'work',
      confidence: 0.95,
      summary: 'Discussion about project timeline',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      call_id: '2',
      user_id: userId,
      caller_phone: '+66823456789',
      caller_name: 'Sarah Johnson',
      call_type: 'missed',
      status: 'completed',
      category: 'uncategorized',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
  },
  getCallDetails: async (userId: string, callId: string): Promise<CallLog> => {
    // For development/testing
    return {
      call_id: callId,
      user_id: userId,
      caller_phone: '+66812345678',
      caller_name: 'John Smith',
      call_type: 'incoming',
      status: 'completed',
      category: 'work',
      confidence: 0.95,
      summary: 'Discussion about project timeline and next steps for the AIS AI Secretary project.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },
  getCallSegments: async (callId: string): Promise<CallSegment[]> => {
    // For development/testing
    return [{
      segment_id: 1,
      call_id: callId,
      start_ms: 0,
      end_ms: 5000,
      speaker: 'caller',
      text: 'สวัสดีครับ ผมโทรมาเรื่องโปรเจคที่เราคุยกันไว้',
      confidence: 0.92
    }, {
      segment_id: 2,
      call_id: callId,
      start_ms: 5500,
      end_ms: 12000,
      speaker: 'receiver',
      text: 'สวัสดีค่ะ ใช่ค่ะ เรากำลังรอข้อมูลจากคุณอยู่พอดีเลยค่ะ',
      confidence: 0.88
    }, {
      segment_id: 3,
      call_id: callId,
      start_ms: 12500,
      end_ms: 20000,
      speaker: 'caller',
      text: 'ครับ ผมจะส่งข้อมูลให้ภายในวันนี้ครับ',
      confidence: 0.95
    }];
  }
};
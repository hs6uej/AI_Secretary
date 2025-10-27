// src/services/callsService.ts
import api from './api';
import { CallLog, CallSegment } from '../types/call';

// Interface for API response to match backend structure
interface GetCallsApiResponse {
  items: CallLog[];
  next_cursor: string | null;
}

// Interface for detailed call response including segments
interface GetCallDetailsApiResponse extends CallLog {
  segments: CallSegment[];
}


// ฟังก์ชันสำหรับแปลงค่า filter เป็นช่วงวันที่ (ยังคงเดิม)
const getDatesFromFilter = (filter?: string) => {
  const now = new Date();
  let from: string | undefined;
  let to: string | undefined;

  switch (filter) {
    case 'today':
      from = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      // Add 'to' for today to capture up to the end of the day if backend logic requires it
      // to = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      break;
    case 'yesterday':
      const yesterdayStart = new Date();
      yesterdayStart.setDate(now.getDate() - 1);
      from = new Date(yesterdayStart.setHours(0, 0, 0, 0)).toISOString();
      const yesterdayEnd = new Date();
      yesterdayEnd.setDate(now.getDate() - 1);
      to = new Date(yesterdayEnd.setHours(23, 59, 59, 999)).toISOString(); // ถึงสิ้นสุดวันเมื่อวาน
      break;
    case 'week':
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      from = new Date(firstDayOfWeek.setHours(0, 0, 0, 0)).toISOString();
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
    case 'all':
    default:
      break;
  }
  return { from, to };
};

export const callsService = {
  // CHANGED: Updated return type and params based on new backend structure
  getCalls: async (userId: string, filter?: string, // userId ไม่ได้ใช้ใน backend ปัจจุบัน แต่เก็บไว้เผื่ออนาคต
                   options: { limit?: number, cursor?: string } = {} ): Promise<GetCallsApiResponse> => {
    const { from, to } = getDatesFromFilter(filter);

    const params: { from?: string, to?: string, limit?: number, cursor?: string } = { ...options };
    if (from) params.from = from;
    if (to) params.to = to;

    // เปลี่ยน endpoint ถ้าจำเป็น (ยังคงเดิมคือ /calls)
    const response = await api.get<GetCallsApiResponse>('/calls', { params });
    // response.data ควรมี items และ next_cursor
    return response.data;
  },

  // CHANGED: Updated return type to match new backend structure
  getCallDetails: async (callId: string): Promise<GetCallDetailsApiResponse> => { // userId ไม่จำเป็นต้องส่งแล้ว
    const response = await api.get<GetCallDetailsApiResponse>(`/calls/${callId}`);
    return response.data; // response.data ควรมี CallLog fields + segments array
  },

  // เพิ่ม function สำหรับ endpoint เฉพาะ ถ้าต้องการ
  getMissedCalls: async (userId: string, filter?: string, options: { limit?: number, cursor?: string } = {}): Promise<GetCallsApiResponse> => {
     const { from, to } = getDatesFromFilter(filter);
     const params: { userId: string, from?: string, to?: string, limit?: number, cursor?: string } = { userId, ...options };
     if (from) params.from = from;
     if (to) params.to = to;
     // ใช้ endpoint /api/calls/missed
     const response = await api.get<GetCallsApiResponse>('/calls/missed', { params });
     return response.data;
  },

   getFailedCalls: async (userId: string, filter?: string, options: { limit?: number, cursor?: string } = {}): Promise<GetCallsApiResponse> => {
     const { from, to } = getDatesFromFilter(filter);
     const params: { userId: string, from?: string, to?: string, limit?: number, cursor?: string } = { userId, ...options };
     if (from) params.from = from;
     if (to) params.to = to;
     // ใช้ endpoint /api/calls/failed
     const response = await api.get<GetCallsApiResponse>('/calls/failed', { params });
     return response.data;
  },

};
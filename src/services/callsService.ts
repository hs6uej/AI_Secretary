// src/services/callsService.ts
import api from './api';
// MODIFIED: (Case 7) Import AudioData และ CallLog, CallSegment
import { CallLog, CallSegment, AudioData } from '../types/call';

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
      // to = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      break;
    case 'yesterday':
      const yesterdayStart = new Date();
      yesterdayStart.setDate(now.getDate() - 1);
      from = new Date(yesterdayStart.setHours(0, 0, 0, 0)).toISOString();
      const yesterdayEnd = new Date();
      yesterdayEnd.setDate(now.getDate() - 1);
      to = new Date(yesterdayEnd.setHours(23, 59, 59, 999)).toISOString();
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday
      from = new Date(weekStart.setHours(0, 0, 0, 0)).toISOString();
      // to = new Date(now.setHours(23, 59, 59, 999)).toISOString(); // To now
      break;
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      from = new Date(monthStart.setHours(0, 0, 0, 0)).toISOString();
      // to = new Date(now.setHours(23, 59, 59, 999)).toISOString(); // To now
      break;
    case 'all':
    default:
      from = undefined;
      to = undefined;
      break;
  }
  return { from, to };
};


export const callsService = {
  // MODIFIED: Removed userId from signature. It's handled by token in backend.
  getAllCalls: async (filter?: string, options: { limit?: number, cursor?: string } = {}): Promise<GetCallsApiResponse> => {
    const { from, to } = getDatesFromFilter(filter);

    // MODIFIED: Removed userId from params
    const params: { from?: string, to?: string, limit?: number, cursor?: string } = { ...options };
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get<GetCallsApiResponse>('/calls', { params });
    return response.data;
  },

  // MODIFIED: Removed userId from signature
  getCallDetails: async (callId: string): Promise<GetCallDetailsApiResponse> => {
    const response = await api.get<GetCallDetailsApiResponse>(`/calls/${callId}`);
    return response.data; 
  },

  // ADDED (Case 7): Function to fetch call audio data
  getCallAudio: async (callId: string): Promise<AudioData> => {
    const response = await api.get<AudioData>(`/calls/${callId}/audio`);
    return response.data;
  },

  // MODIFIED: Removed userId from signature (Fixes error in image)
  getMissedCalls: async (filter?: string, options: { limit?: number, cursor?: string } = {}): Promise<GetCallsApiResponse> => {
     const { from, to } = getDatesFromFilter(filter);
     // MODIFIED: Removed userId from params
     const params: { from?: string, to?: string, limit?: number, cursor?: string } = { ...options };
     if (from) params.from = from;
     if (to) params.to = to;
     
     // NOTE: Backend (server.js) does not have '/calls/missed'. 
     // This will fail runtime unless server.js is updated.
     const response = await api.get<GetCallsApiResponse>('/calls/missed', { params });
     return response.data;
  },

  // MODIFIED: Removed userId from signature (Fixes error in image)
   getFailedCalls: async (filter?: string, options: { limit?: number, cursor?: string } = {}): Promise<GetCallsApiResponse> => {
     const { from, to } = getDatesFromFilter(filter);
     // MODIFIED: Removed userId from params
     const params: { from?: string, to?: string, limit?: number, cursor?: string } = { ...options };
     if (from) params.from = from;
     if (to) params.to = to;
     
     // NOTE: Backend (server.js) does not have '/calls/failed'.
     const response = await api.get<GetCallsApiResponse>('/calls/failed', { params });
     return response.data;
  },
};
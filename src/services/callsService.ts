import api from './api';
import { CallLog, CallSegment } from '../types/call';

// ฟังก์ชันสำหรับแปลงค่า filter เป็นช่วงวันที่
const getDatesFromFilter = (filter?: string) => {
  const now = new Date();
  let from: string | undefined;
  let to: string | undefined;

  switch (filter) {
    case 'today':
      // ตั้งเวลาเป็นเที่ยงคืนของวันนี้
      from = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      break;
    case 'yesterday':
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      // 'from' คือเที่ยงคืนของเมื่อวาน
      from = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString();
      // 'to' คือเที่ยงคืนของวันนี้
      to = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      break;
    case 'week':
      // หาวันแรกของสัปดาห์ (วันอาทิตย์)
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      from = new Date(firstDayOfWeek.setHours(0, 0, 0, 0)).toISOString();
      break;
    case 'month':
      // หาวันแรกของเดือน
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
    case 'all':
    default:
      // ไม่มีการกรองตามวันที่
      break;
  }
  return { from, to };
};

export const callsService = {
  getCalls: async (userId: string, filter?: string): Promise<CallLog[]> => {
    // แปลงค่า filter เป็น from, to
    const { from, to } = getDatesFromFilter(filter);
    
    // สร้าง object params สำหรับส่งไปกับ request
    const params: { userId: string, from?: string, to?: string } = { userId };
    if (from) params.from = from;
    if (to) params.to = to;

    // ส่ง request ไปยัง API โดยใช้ params ที่ถูกต้อง
    const response = await api.get('/calls', { params });
    return response.data.items;
  },

  getCallDetails: async (userId: string, callId: string): Promise<CallLog & { segments: CallSegment[] }> => {
    const response = await api.get(`/calls/${callId}`);
    return response.data;
  },
};
// src/services/contactsService.ts
import api from './api';
import { Contact, ContactStatus } from '../types/contact'; // Updated Contact type

// Interface for API response to match backend structure
interface GetContactsApiResponse {
  items: Contact[];
  next_cursor: string | null;
}


export const contactsService = {
  // GET contacts (คงเดิม)
  getContacts: async (userId: string, // userId ไม่ได้ใช้ใน backend ปัจจุบัน แต่เก็บไว้เผื่ออนาคต
                      options: { status?: string, q?: string, limit?: number, cursor?: string } = {}): Promise<GetContactsApiResponse> => {
    const params: { status?: string, q?: string, limit?: number, cursor?: string } = { ...options };
    const response = await api.get<GetContactsApiResponse>('/contacts', { params });
    return response.data;
  },

  // --- NEW: Add Contact API Call ---
  addContact: async (userId: string, contactData: Omit<Contact, 'user_id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
    // ส่ง userId ไปใน body ด้วย ถ้า backend ต้องการ หรือจะให้ backend ดึงจาก token แทนก็ได้
    // Frontend mock ส่ง user_id มาใน contactData แล้ว แต่เผื่อกรณีทั่วไป อาจจะใส่แบบนี้
    const payload = { ...contactData, user_id: userId };
    const response = await api.post<Contact>('/contacts', payload); // Endpoint: POST /api/contacts
    return response.data; // Backend ควรคืน contact ที่สร้างใหม่กลับมา
  },

  // --- NEW: Update Contact API Call ---
  // ใช้ callerNumber เป็น key ใน URL, ส่งข้อมูลที่จะแก้ไปใน body
  updateContact: async (userId: string, callerNumber: string, contactUpdate: Partial<Omit<Contact, 'user_id' | 'caller_number' | 'created_at'>>): Promise<Contact> => {
    // Endpoint: PUT /api/contacts/:userId/:callerNumber (userId อาจไม่จำเป็นถ้า backend ใช้ token)
    // Encode callerNumber เผื่อมีตัวอักษรพิเศษ (เช่น +)
    const encodedCallerNumber = encodeURIComponent(callerNumber);
    const response = await api.put<Contact>(`/contacts/${userId}/${encodedCallerNumber}`, contactUpdate);
    return response.data; // Backend ควรคืน contact ที่อัปเดตแล้วกลับมา
  },

  // --- NEW: Delete Contact API Call ---
  // ใช้ callerNumber เป็น key ใน URL
  deleteContact: async (userId: string, callerNumber: string): Promise<void> => {
    // Endpoint: DELETE /api/contacts/:userId/:callerNumber (userId อาจไม่จำเป็นถ้า backend ใช้ token)
    const encodedCallerNumber = encodeURIComponent(callerNumber);
    await api.delete(`/contacts/${userId}/${encodedCallerNumber}`);
    // ไม่ต้อง return อะไรถ้าสำเร็จ (status 204)
  }
};
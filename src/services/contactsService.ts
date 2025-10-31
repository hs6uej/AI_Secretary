// src/services/contactsService.ts
import api from './api';
import { Contact } from '../types/contact';

// Interface for API response
interface GetContactsApiResponse {
  items: Contact[];
  next_cursor: string | null;
}

export const contactsService = {
  // MODIFIED: Removed userId from arguments, it's handled by token
  getAllContacts: async (filter: string, searchTerm: string, options: { limit?: number, cursor?: string } = {}): Promise<GetContactsApiResponse> => {
    
    // Backend expects filter/search via query params
    const params: { status?: string, q?: string, limit?: number, cursor?: string } = { ...options };
    
    if (filter !== 'all') {
      params.status = filter.toUpperCase(); // WHITELISTED, BLACKLISTED, UNKNOWN
    }
    if (searchTerm) {
      params.q = searchTerm;
    }

    // MODIFIED: Removed userId from params (it's in the token)
    const response = await api.get<GetContactsApiResponse>('/contacts', { params });
    return response.data;
  },

  // MODIFIED: This function is critical for Case 2 & 3
  // Backend endpoint is PUT /api/contacts/:userId/:callerNumber
  updateContact: async (
    userId: string, 
    callerNumber: string, 
    data: { caller_name?: string, status?: 'WHITELISTED' | 'BLACKLISTED' | 'UNKNOWN', notes?: string }
  ): Promise<Contact> => {
    // We must encode callerNumber if it contains special chars (like '+')
    const encodedCallerNumber = encodeURIComponent(callerNumber);
    
    // Construct the URL as expected by the backend
    const response = await api.put<Contact>(`/contacts/${userId}/${encodedCallerNumber}`, data);
    return response.data;
  },

  // ADDED: A function to add a new contact
  addContact: async (data: {
    caller_number: string, 
    caller_name?: string, 
    status: 'WHITELISTED' | 'BLACKLISTED' | 'UNKNOWN', 
    notes?: string 
  }): Promise<Contact> => {
    // userId is not needed in body, it's from the token
    const response = await api.post<Contact>('/contacts', data);
    return response.data;
  },
};
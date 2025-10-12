import api from './api';
import { Contact } from '../types/contact';

export const contactsService = {
  getContacts: async (userId: string): Promise<Contact[]> => {
    const response = await api.get('/contacts');
    return response.data.items;
  },

  addContact: async (userId: string, contact: Omit<Contact, 'contact_id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
    // For development/testing - Backend endpoint not available
    console.warn('addContact is not implemented in the backend');
    return {
      contact_id: Math.floor(Math.random() * 1000),
      user_id: userId,
      ...contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  updateContact: async (userId: string, contactId: number, contact: Partial<Contact>): Promise<Contact> => {
    // For development/testing - Backend endpoint not available
    console.warn('updateContact is not implemented in the backend');
    return {
      contact_id: contactId,
      user_id: userId,
      phone: contact.phone || '',
      name: contact.name || '',
      status: contact.status || 'WHITE',
      notes: contact.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  deleteContact: async (userId: string, contactId: number): Promise<void> => {
    // For development/testing - Backend endpoint not available
    console.warn('deleteContact is not implemented in the backend');
    return Promise.resolve();
  }
};
import { Contact } from '../types/contact';
export const contactsService = {
  getContacts: async (userId: string): Promise<Contact[]> => {
    // For development/testing
    return [{
      contact_id: 1,
      user_id: userId,
      phone: '+66812345678',
      name: 'John Smith',
      status: 'WHITE',
      notes: 'Family friend',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      contact_id: 2,
      user_id: userId,
      phone: '+6621111111',
      name: 'Bangkok Bank',
      status: 'WHITE',
      notes: 'My bank',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      contact_id: 3,
      user_id: userId,
      phone: '+66899999999',
      name: 'Telemarketer',
      status: 'BLACK',
      notes: 'Spam caller',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
  },
  addContact: async (userId: string, contact: Omit<Contact, 'contact_id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Contact> => {
    // For development/testing
    return {
      contact_id: Math.floor(Math.random() * 1000),
      user_id: userId,
      ...contact,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },
  updateContact: async (userId: string, contactId: number, contact: Partial<Contact>): Promise<Contact> => {
    // For development/testing
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
    // For development/testing
    return Promise.resolve();
  }
};
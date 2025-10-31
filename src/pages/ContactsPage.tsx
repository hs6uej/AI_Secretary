// src/pages/ContactsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { contactsService } from '../services/contactsService';
import { Contact } from '../types/contact';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { 
  SearchIcon, UserPlusIcon, Edit2Icon, Trash2Icon,
  // (Case 14) Icons for filter buttons (using correct names)
  List, CheckCircle, XCircle, HelpCircle 
} from 'lucide-react';

type FilterType = 'all' | 'whitelisted' | 'blacklisted' | 'unknown';

export const ContactsPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // (Case 14)
  const [filter, setFilter] = useState<FilterType>('all'); 
  
  // TODO: Add state for pagination (cursor)

  // MODIFIED (Fix Infinite Loop):
  // 1. useCallback must NOT depend on 'isLoading'.
  //    It now takes filter/search as arguments.
  const fetchContacts = useCallback(async (currentFilter: FilterType, currentSearchTerm: string) => {
    // We can remove the 'if (isLoading) return;' check 
    // because useEffect dependencies handle this.
    setIsLoading(true);
    setError(null);
    try {
      // Use the arguments passed in
      const response = await contactsService.getAllContacts(
        currentFilter, 
        currentSearchTerm
        // TODO: Add pagination options here
      );
      setContacts(response.items);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      setError('Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  }, []); // <-- Dependency array is now empty (or depends only on stable functions)

  // 2. useEffect now calls fetchContacts with the current state values.
  useEffect(() => {
    if (user) { // Only fetch if user is loaded
      fetchContacts(filter, searchTerm);
    }
  }, [user, filter, searchTerm, fetchContacts]); // <-- This is now safe
  // --- End Infinite Loop Fix ---

  const handleAddContact = () => {
    // TODO: Implement "Add Contact" modal or logic
    alert('Add contact functionality not implemented yet.');
  };
  
  const handleEditContact = (contact: Contact) => {
    // TODO: Implement "Edit Contact" modal or logic
    alert(`Editing ${contact.caller_name || contact.caller_number}...`);
  };

  const handleDeleteContact = (contact: Contact) => {
    // TODO: Implement "Delete Contact" logic with confirmation
    alert(`Deleting ${contact.caller_name || contact.caller_number}...`);
  };

  // (Case 14) Helper component for filter buttons
  const FilterButton: React.FC<{
    value: FilterType;
    current: FilterType;
    onClick: (value: FilterType) => void;
    children: React.ReactNode;
  }> = ({ value, current, onClick, children }) => {
    const isActive = value === current;
    return (
      <button
        onClick={() => onClick(value)}
        className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
          isActive
            ? 'bg-primary-100 border-primary text-primary'
            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Contacts</h1>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* (Case 14) FilterButton group */}
        <div className="flex items-center space-x-2">
          <FilterButton value="all" current={filter} onClick={setFilter}>
            <List size={16} className="mr-1.5" /> All
          </FilterButton>
          <FilterButton value="whitelisted" current={filter} onClick={setFilter}>
            <CheckCircle size={16} className="mr-1.5 text-success" /> Whitelisted
          </FilterButton>
          <FilterButton value="blacklisted" current={filter} onClick={setFilter}>
            <XCircle size={16} className="mr-1.5 text-destructive" /> Blacklisted
          </FilterButton>
          <FilterButton value="unknown" current={filter} onClick={setFilter}>
            <HelpCircle size={16} className="mr-1.5 text-gray-500" /> Unknown
          </FilterButton>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input
            placeholder="Search name, number, notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<SearchIcon size={18} className="text-gray-500" />}
            className="flex-1" // Take available space
          />
          <Button onClick={handleAddContact} className="flex-shrink-0">
            <UserPlusIcon size={18} className="mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Contacts List / Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-destructive">{error}</td>
                </tr>
              ) : contacts.length === 0 ? (
                 <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">No contacts found.</td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.caller_number} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contact.caller_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{contact.caller_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contact.status === 'WHITELISTED' ? 'bg-success-100 text-success-800' :
                        contact.status === 'BLACKLISTED' ? 'bg-destructive-100 text-destructive-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate" title={contact.notes || ''}>
                      {contact.notes || 'N/A'}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(contact.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                       <button onClick={() => handleEditContact(contact)} className="text-primary hover:text-primary-700" title="Edit">
                        <Edit2Icon size={18} />
                      </button>
                      <button onClick={() => handleDeleteContact(contact)} className="text-destructive hover:text-destructive-700" title="Delete">
                        <Trash2Icon size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
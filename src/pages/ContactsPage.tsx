// src/pages/ContactsPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Make sure useAuth is imported
import { SearchIcon, PlusIcon, MoreVerticalIcon, UserPlusIcon, UserMinusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Contact, ContactStatus } from '../types/contact';
import { contactsService } from '../services/contactsService';

export const ContactsPage: React.FC = () => {
  const { user } = useAuth(); // Get the user object from context
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [currentContact, setCurrentContact] = useState<Partial<Contact> & { isEditing?: boolean }>({
    caller_name: '',
    caller_number: '',
    status: 'WHITELISTED', // Default to WHITELISTED
    notes: ''
  });
  const [apiError, setApiError] = useState<string | null>(null); // State for API errors

  useEffect(() => {
    const fetchContacts = async () => {
      // *** Check if user exists before fetching ***
      if (!user || !user.user_id) {
          setIsLoading(false); // Stop loading if no user
          setApiError("User not logged in. Cannot fetch contacts."); // Show error
          return;
      }
      setIsLoading(true);
      setApiError(null); // Clear previous errors
      try {
        // Pass user_id if needed by GET (though backend might not use it now)
        const response = await contactsService.getContacts(user.user_id);
        setContacts(response.items);
      } catch (error) {
        console.error('Failed to load contacts:', error);
        setApiError(`Failed to load contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContacts();
  }, [user]); // Dependency on user object

  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch = (contact.caller_name && contact.caller_name.toLowerCase().includes(lowerSearchTerm)) ||
                          contact.caller_number.includes(searchTerm) ||
                          (contact.notes && contact.notes.toLowerCase().includes(lowerSearchTerm));
    return matchesSearch;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setCurrentContact(prev => ({ ...prev, [name]: value }));
  };

   const handleStatusChange = (status: ContactStatus) => {
       setCurrentContact(prev => ({ ...prev, status }));
   };

   const handleShowAddModal = () => {
       setCurrentContact({ caller_name: '', caller_number: '', status: 'WHITELISTED', notes: '', isEditing: false });
       setApiError(null); // Clear errors when opening modal
       setShowAddContact(true);
   }

   const handleShowEditModal = (contact: Contact) => {
       setCurrentContact({ ...contact, isEditing: true });
       setApiError(null); // Clear errors when opening modal
       setShowAddContact(true);
   }

   const handleCancel = () => {
        setShowAddContact(false);
        setCurrentContact({});
        setApiError(null); // Clear errors on cancel
   }

  const handleSaveContact = async () => {
    // *** ENSURE user exists before proceeding ***
    if (!currentContact.caller_number || !user || !user.user_id) {
      setApiError('Phone number is required and user must be logged in.');
      return;
    }
    if (!/^\+?\d{9,}$/.test(currentContact.caller_number.replace(/\s+/g, ''))) { // Basic validation, allow + and min 9 digits
        setApiError('Please enter a valid phone number (e.g., +66812345678 or 0812345678).');
        return;
    }

    setIsLoading(true);
    setApiError(null); // Clear previous errors

    try {
        if (currentContact.isEditing) {
            // *** PASS user.user_id here ***
             const updatedContact = await contactsService.updateContact(
                 user.user_id, // Pass the actual user_id
                 currentContact.caller_number, // Pass the original caller_number as identifier
                 { // Only pass fields that can be updated
                    caller_name: currentContact.caller_name || null,
                    status: currentContact.status,
                    notes: currentContact.notes || null,
                 }
             );
             setContacts(contacts.map(c => (c.user_id === updatedContact.user_id && c.caller_number === updatedContact.caller_number) ? updatedContact : c));

        } else {
             // Prepare data for adding new contact
             const newContactData: Omit<Contact, 'user_id' | 'created_at' | 'updated_at'> = {
                caller_number: currentContact.caller_number,
                caller_name: currentContact.caller_name || null,
                status: currentContact.status || 'UNKNOWN', // Ensure status is set
                notes: currentContact.notes || null,
            };
             // *** PASS user.user_id here ***
            const addedContact = await contactsService.addContact(user.user_id, newContactData); // Pass the actual user_id
            setContacts(prevContacts => [...prevContacts, addedContact]); // Use functional update
        }
        handleCancel(); // Close modal on success
    } catch (error) {
         console.error("Failed to save contact:", error);
         // Display specific error from backend if available
         const message = (error instanceof Error && (error as any).response?.data?.message)
                       ? (error as any).response.data.message
                       : (error instanceof Error ? error.message : 'Unknown error');
         setApiError(`Failed to save contact: ${message}`);
         // Keep modal open if error occurs
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteContact = async (callerNumber: string) => {
    // *** ENSURE user exists ***
    if (!user || !user.user_id) {
        alert("User not logged in.");
        return;
    };
    if (confirm(`Are you sure you want to delete contact ${callerNumber}? This cannot be undone.`)) {
       setIsLoading(true);
       setApiError(null);
       try {
            // *** PASS user.user_id here ***
            await contactsService.deleteContact(user.user_id, callerNumber); // Pass the actual user_id
            setContacts(prevContacts => prevContacts.filter(c => c.caller_number !== callerNumber)); // Use functional update
       } catch (error) {
           console.error("Failed to delete contact:", error);
            const message = (error instanceof Error && (error as any).response?.data?.message)
                       ? (error as any).response.data.message
                       : (error instanceof Error ? error.message : 'Unknown error');
           alert(`Failed to delete contact: ${message}`); // Use alert for delete errors
           setApiError(`Failed to delete contact: ${message}`); // Also set state error if needed elsewhere
       } finally {
           setIsLoading(false);
       }
    }
  };

  // handleToggleStatus can be simplified by calling updateContact
  const handleToggleStatus = async (contactToToggle: Contact) => {
     if (!user || !user.user_id) {
        alert("User not logged in.");
        return;
     }

     const newStatus = contactToToggle.status === 'WHITELISTED' ? 'BLACKLISTED' : 'WHITELISTED';
     setIsLoading(true);
     setApiError(null);
      try {
            // *** Use updateContact to toggle status ***
            const updatedContact = await contactsService.updateContact(user.user_id, contactToToggle.caller_number, { status: newStatus });
            setContacts(prevContacts => prevContacts.map(c => (c.user_id === updatedContact.user_id && c.caller_number === updatedContact.caller_number) ? updatedContact : c)); // Use functional update
       } catch (error) {
           console.error("Failed to toggle contact status:", error);
            const message = (error instanceof Error && (error as any).response?.data?.message)
                       ? (error as any).response.data.message
                       : (error instanceof Error ? error.message : 'Unknown error');
           alert(`Failed to toggle status: ${message}`); // Use alert for toggle errors
           setApiError(`Failed to toggle status: ${message}`);
       } finally {
           setIsLoading(false);
       }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Contacts</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Input
          placeholder="Search name, number, notes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftIcon={<SearchIcon size={18} className="text-gray-500" />}
          className="md:max-w-xs"
          fullWidth
        />
        <Button onClick={handleShowAddModal} className="flex items-center">
          <PlusIcon size={16} className="mr-1" />
          Add Contact
        </Button>
      </div>

      {/* Add/Edit Contact Modal Form */}
      {showAddContact && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 relative"> {/* Added relative positioning */}
          {/* Close button */}
           <button onClick={handleCancel} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" title="Close">
                &times; {/* Simple X icon */}
           </button>
          <h2 className="text-lg font-medium mb-4">{currentContact.isEditing ? 'Edit Contact' : 'Add New Contact'}</h2>
          {/* Display API Error in Modal */}
          {apiError && (
             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {apiError}
             </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label="Name" name="caller_name" value={currentContact.caller_name || ''} onChange={handleInputChange} fullWidth />
            <Input
                label="Phone Number"
                name="caller_number"
                value={currentContact.caller_number || ''}
                onChange={handleInputChange}
                fullWidth
                required
                disabled={currentContact.isEditing} // Disable editing phone number (primary key part)
                placeholder="+66XXXXXXXXX or 0XXXXXXXXX"
                error={!currentContact.caller_number ? 'Phone number is required' : undefined} // Basic validation feedback
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Status *
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="contactStatus" value="WHITELISTED" checked={currentContact.status === 'WHITELISTED'} onChange={() => handleStatusChange('WHITELISTED')} className="mr-2" required/>
                  Whitelist
                </label>
                 <label className="flex items-center">
                  <input type="radio" name="contactStatus" value="BLACKLISTED" checked={currentContact.status === 'BLACKLISTED'} onChange={() => handleStatusChange('BLACKLISTED')} className="mr-2" />
                  Blacklist
                </label>
                 <label className="flex items-center">
                  <input type="radio" name="contactStatus" value="UNKNOWN" checked={currentContact.status === 'UNKNOWN'} onChange={() => handleStatusChange('UNKNOWN')} className="mr-2" />
                  Unknown
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea name="notes" value={currentContact.notes || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" rows={3} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveContact} disabled={isLoading || !currentContact.caller_number || !currentContact.status} loading={isLoading}>
                {currentContact.isEditing ? 'Save Changes' : 'Add Contact'}
            </Button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      {isLoading && !showAddContact ? (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No contacts found {searchTerm ? 'matching your search' : ''}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-auto"> {/* Added overflow-auto for smaller screens */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map(contact => (
                // Use a combination of user_id and caller_number for a unique key
                <tr key={`${contact.user_id}-${contact.caller_number}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contact.caller_name || '--'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{contact.caller_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contact.status === 'WHITELISTED' ? 'bg-green-100 text-green-800' :
                        contact.status === 'BLACKLISTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600' // Style for UNKNOWN
                      }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 truncate max-w-xs" title={contact.notes || ''}>
                      {contact.notes || '--'}
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{new Date(contact.updated_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-2">
                       {/* Pass the whole contact object to toggle status */}
                       <button onClick={() => handleToggleStatus(contact)}
                                title={contact.status === 'WHITELISTED' ? 'Move to Blacklist' : 'Move to Whitelist'}
                                className={`p-1 rounded hover:bg-gray-200 ${contact.status === 'WHITELISTED' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                disabled={isLoading} >
                           {contact.status === 'WHITELISTED' ? <UserMinusIcon size={16} /> : <UserPlusIcon size={16} />}
                       </button>
                        <button onClick={() => handleShowEditModal(contact)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-gray-200" title="Edit Contact" disabled={isLoading}>
                            <EditIcon size={16} />
                        </button>
                        <button onClick={() => handleDeleteContact(contact.caller_number)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-gray-200" title="Delete Contact" disabled={isLoading}>
                            <TrashIcon size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SearchIcon, PlusIcon, MoreVerticalIcon, UserPlusIcon, UserMinusIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Contact } from '../types/contact';
export const ContactsPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    status: 'WHITE' as 'WHITE' | 'BLACK',
    notes: ''
  });
  useEffect(() => {
    // Mock loading contacts
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockContacts = [{
        contact_id: 1,
        user_id: user?.user_id || '',
        phone: '+66812345678',
        name: 'John Smith',
        status: 'WHITE' as const,
        notes: 'Family friend',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        contact_id: 2,
        user_id: user?.user_id || '',
        phone: '+6621111111',
        name: 'Bangkok Bank',
        status: 'WHITE' as const,
        notes: 'My bank',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        contact_id: 3,
        user_id: user?.user_id || '',
        phone: '+66899999999',
        name: 'Telemarketer',
        status: 'BLACK' as const,
        notes: 'Spam caller',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
      setContacts(mockContacts);
      setIsLoading(false);
    }, 1000);
  }, [user]);
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || contact.phone.includes(searchTerm);
    return matchesSearch;
  });
  const handleAddContact = () => {
    if (!newContact.phone) {
      alert('Phone number is required');
      return;
    }
    // Add the new contact
    const newContactWithId = {
      ...newContact,
      contact_id: Date.now(),
      user_id: user?.user_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setContacts([...contacts, newContactWithId]);
    setShowAddContact(false);
    setNewContact({
      name: '',
      phone: '',
      status: 'WHITE',
      notes: ''
    });
  };
  const handleDeleteContact = (contactId: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContacts(contacts.filter(c => c.contact_id !== contactId));
    }
  };
  const handleToggleStatus = (contactId: number) => {
    setContacts(contacts.map(contact => {
      if (contact.contact_id === contactId) {
        return {
          ...contact,
          status: contact.status === 'WHITE' ? 'BLACK' : 'WHITE',
          updated_at: new Date().toISOString()
        };
      }
      return contact;
    }));
  };
  return <div>
      <h1 className="text-2xl font-semibold mb-6">Contacts</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Input placeholder="Search contacts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<SearchIcon size={18} className="text-gray-500" />} className="md:max-w-xs" fullWidth />
        <Button onClick={() => setShowAddContact(true)} className="flex items-center">
          <PlusIcon size={16} className="mr-1" />
          Add Contact
        </Button>
      </div>
      {showAddContact && <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium mb-4">Add New Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label="Name" value={newContact.name} onChange={e => setNewContact({
          ...newContact,
          name: e.target.value
        })} fullWidth />
            <Input label="Phone Number" value={newContact.phone} onChange={e => setNewContact({
          ...newContact,
          phone: e.target.value
        })} fullWidth required />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Type
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="contactType" value="WHITE" checked={newContact.status === 'WHITE'} onChange={() => setNewContact({
                ...newContact,
                status: 'WHITE'
              })} className="mr-2" />
                  Whitelist
                </label>
                <label className="flex items-center">
                  <input type="radio" name="contactType" value="BLACK" checked={newContact.status === 'BLACK'} onChange={() => setNewContact({
                ...newContact,
                status: 'BLACK'
              })} className="mr-2" />
                  Blacklist
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea value={newContact.notes} onChange={e => setNewContact({
            ...newContact,
            notes: e.target.value
          })} className="w-full p-2 border border-gray-300 rounded-md" rows={3} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAddContact(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContact}>Add Contact</Button>
          </div>
        </div>}
      {isLoading ? <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div> : filteredContacts.length === 0 ? <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No contacts found</p>
        </div> : <div className="bg-white rounded-lg shadow overflow-hidden">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map(contact => <tr key={contact.contact_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contact.name || 'No Name'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{contact.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contact.status === 'WHITE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {contact.status === 'WHITE' ? 'Whitelist' : 'Blacklist'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {contact.notes || 'No notes'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end">
                      <button onClick={() => handleToggleStatus(contact.contact_id)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                        {contact.status === 'WHITE' ? <UserMinusIcon size={16} title="Add to blacklist" /> : <UserPlusIcon size={16} title="Add to whitelist" />}
                      </button>
                      <button onClick={() => handleDeleteContact(contact.contact_id)} className="text-red-600 hover:text-red-900">
                        <MoreVerticalIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>}
    </div>;
};
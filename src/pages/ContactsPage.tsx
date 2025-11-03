// src/pages/ContactsPage.tsx (FIXED: Correctly save cleared notes/name)
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { contactsService } from '../services/contactsService';
import { Contact, ContactStatus } from '../types/contact';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  SearchIcon, UserPlusIcon, Edit2Icon, Trash2Icon,
  List, CheckCircle, XCircle, HelpCircle, X as XIcon
} from 'lucide-react';

type FilterType = 'all' | 'whitelisted' | 'blacklisted' | 'unknown';

const isValidStatus = (status: string | null): status is ContactStatus => {
  if (!status) return false;
  return ['WHITELISTED', 'BLACKLISTED', 'UNKNOWN'].includes(status.toUpperCase());
};

/** ---------- Lightweight Modal ---------- */
const Modal: React.FC<{
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ open, title, onClose, children, footer, size = 'md' }) => {
  if (!open) return null;
  const maxW =
    size === 'sm' ? 'max-w-md' :
    size === 'lg' ? 'max-w-3xl' :
    size === 'xl' ? 'max-w-5xl' :
    'max-w-2xl';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"> {/* Added p-4 for safety */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxW} rounded-2xl bg-white shadow-2xl border`}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div> {/* Added overflow */}
        {footer && <div className="px-5 py-4 border-t bg-gray-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
};

/** ---------- Page ---------- */
export const ContactsPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form fields
  const [fNumber, setFNumber] = useState('');
  const [fName, setFName] = useState('');
  const [fStatus, setFStatus] = useState<ContactStatus>('UNKNOWN');
  const [fNotes, setFNotes] = useState('');
  const [fError, setFError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: pagination (cursor)

  const fetchContacts = useCallback(async (currentFilter: FilterType, currentSearchTerm: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contactsService.getAllContacts(currentFilter, currentSearchTerm);
      setContacts(response.items);
    } catch (err: any) {
      console.error('Failed to fetch contacts:', err);
      setError('Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchContacts(filter, searchTerm);
    }
  }, [user, filter, searchTerm, fetchContacts]);

  /** ---------- Helpers ---------- */
  const resetForm = () => {
    setFNumber('');
    setFName('');
    setFStatus('UNKNOWN');
    setFNotes('');
    setFError(null);
  };

  const openAddModal = () => {
    setFormMode('add');
    setSelectedContact(null);
    resetForm();
    setIsFormOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setFormMode('edit');
    setSelectedContact(contact);
    setFNumber(contact.caller_number);
    setFName(contact.caller_name || '');
    setFStatus((contact.status?.toUpperCase() as ContactStatus) || 'UNKNOWN');
    setFNotes(contact.notes || '');
    setFError(null);
    setIsFormOpen(true);
  };

  const openDeleteModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    if (!fNumber?.trim()) return 'Phone number is required.';
    const onlyDigits = fNumber.replace(/\D+/g, '');
    if (onlyDigits.length < 8 || onlyDigits.length > 12) return 'Phone number looks invalid.';
    if (!isValidStatus(fStatus)) return 'Status must be WHITELISTED, BLACKLISTED, or UNKNOWN.';
    return null;
  };

/** ---------- Submit Add/Edit ---------- */
  const submitForm = async () => {
    const err = validateForm();
    if (err) { setFError(err); return; }
    setIsSubmitting(true);
    try {
      if (formMode === 'add') {
        // (Logic for ADD mode is fine, server handles || null)
        await contactsService.addContact({
          caller_number: fNumber.trim(),
          caller_name: fName.trim() || undefined,
          status: fStatus,
          notes: fNotes.trim() || undefined,
        });
      } else if (formMode === 'edit' && selectedContact) {
        
        // --- ‼️‼️ MODIFICATION IS HERE ‼️‼️ ---
        // We must pass the trimmed string (even if empty "")
        // We MUST NOT use "|| undefined" here
        // server.js (PUT endpoint) expects the field to be defined
        // and will handle "" as null.
        await contactsService.updateContact(selectedContact.user_id, selectedContact.caller_number, {
          caller_name: fName.trim(),
          status: fStatus,
          notes: fNotes.trim(),
        });
        // --- ‼️‼️ END MODIFICATION ‼️‼️ ---
        
      }
      setIsFormOpen(false);
      await fetchContacts(filter, searchTerm);
    } catch (err: any) {
      console.error('Submit error:', err);
      setFError(err?.response?.data?.message || err?.message || 'Submit failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** ---------- Delete ---------- */
  const confirmDelete = async () => {
    if (!selectedContact) return;
    setIsSubmitting(true);
    try {
      await contactsService.deleteContact(selectedContact.user_id, selectedContact.caller_number);
      setIsDeleteOpen(false);
      await fetchContacts(filter, searchTerm);
    } catch (err: any) {
      console.error('Failed to delete contact:', err);
      alert(`Failed to delete contact: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** ---------- Filter Buttons ---------- */
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
        className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition ${
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

      {/* Filter + Search + Add */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        
        {/* === MODIFIED: Added flex-wrap and gap-2 === */}
        <div className="flex items-center flex-wrap gap-2">
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
        {/* === END MODIFICATION === */}

        {/* === MODIFIED: Added flex-wrap === */}
        <div className="flex items-center flex-wrap gap-4 w-full md:w-auto">
          <Input
            placeholder="Search name, number, notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<SearchIcon size={18} className="text-gray-500" />}
            className="flex-1 min-w-[200px]" // Added min-w
          />
          <Button onClick={openAddModal} className="flex-shrink-0">
            <UserPlusIcon size={18} className="mr-2" />
            Add Contact
          </Button>
        </div>
        {/* === END MODIFICATION === */}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* === MODIFIED: overflow-x-auto IS THE CORRECT FIX FOR TABLES === */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="p-6 text-center text-destructive">{error}</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No contacts found.</td></tr>
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
                      <button
                        onClick={() => openEditModal(contact)}
                        className="text-primary hover:text-primary-700"
                        title="Edit"
                      >
                        <Edit2Icon size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(contact)}
                        className="text-destructive hover:text-destructive-700"
                        title="Delete"
                      >
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

      {/* ---------- Add/Edit Modal ---------- */}
      <Modal
        open={isFormOpen}
        onClose={() => !isSubmitting && setIsFormOpen(false)}
        title={formMode === 'add' ? 'Add Contact' : 'Edit Contact'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={submitForm} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (formMode === 'add' ? 'Add' : 'Save changes')}
            </Button>
          </div>
        }
      >
        {fError && (
          <div className="mb-3 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {fError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone number */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number<span className="text-destructive">*</span></label>
            <Input
              placeholder="0812345678"
              value={fNumber}
              onChange={e => setFNumber(e.target.value)}
              disabled={formMode === 'edit'} // immutable key
            />
            {formMode === 'edit' && (
              <p className="mt-1 text-xs text-gray-500">Phone number cannot be changed.</p>
            )}
          </div>

          {/* Name */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              placeholder="(optional)"
              value={fName}
              onChange={e => setFName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Status */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              value={fStatus}
              onChange={e => setFStatus(e.target.value.toUpperCase() as ContactStatus)}
              disabled={isSubmitting}
            >
              <option value="WHITELISTED">WHITELISTED</option>
              <option value="BLACKLISTED">BLACKLISTED</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </div>

          {/* Notes */}
          <div className="col-span-1 md:col-span-2">
            {/* --- MODIFIED: Added flex layout and Clear button --- */}
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              {/* Show button only if there is text and not submitting */}
              {fNotes && !isSubmitting && (
                <button
                  type="button"
                  onClick={() => setFNotes('')}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Clear note
                </button>
              )}
            </div>
            {/* --- END MODIFICATION --- */}
            <textarea
              className="w-full min-h-[88px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              placeholder="(optional)"
              value={fNotes}
              onChange={e => setFNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Modal>

      {/* ---------- Delete Confirm Modal ---------- */}
      <Modal
        open={isDeleteOpen}
        onClose={() => !isSubmitting && setIsDeleteOpen(false)}
        title="Delete Contact"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
        size="sm"
      >
        <p className="text-sm text-gray-700">
          Are you sure you want to delete{' '}
          <span className="font-medium">
            {selectedContact?.caller_name || selectedContact?.caller_number}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
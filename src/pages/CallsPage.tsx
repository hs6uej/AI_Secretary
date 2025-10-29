// src/pages/CallsPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallsList } from '../components/dashboard/CallsList';
import { CallDisplay, CallLog, CallType } from '../types/call'; // Import updated types
import { SearchIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';

// Helper function (ปรับปรุงเรื่อง recording)
const mapCallLogToDisplay = (call: CallLog): CallDisplay => {
   let displayStatus: CallDisplay['status'] = 'other';
   if (call.processing_status === 'failed') {
    displayStatus = 'failed';
  } else if (call.processing_status === 'processing' || call.processing_status === 'in_progress') {
    displayStatus = 'processing';
  } else if (call.call_type === 'Missed') {
    displayStatus = 'missed';
  } else if (call.call_type === 'Incoming' || call.call_type === 'Outgoing') {
     if (['completed', 'ended', 'scheduled'].includes(call.processing_status || '')) {
       displayStatus = 'answered';
     } else if (call.processing_status === 'declined_spam') {
       displayStatus = 'blocked';
     }
  }

  // *** ตรวจสอบ voice_log ก่อนกำหนดค่า recording ***
  const hasValidRecordingUrl = !!call.voice_log &&
                                (call.voice_log.startsWith('http://') || call.voice_log.startsWith('https://'));

  return {
    id: call.call_id,
    callerName: call.caller_name || 'Unknown',
    callerNumber: call.caller_phone,
    timestamp: new Date(call.created_at).toLocaleString(),
    type: call.call_type,
    status: displayStatus,
    category: call.category,
    summary: call.summary || undefined,
    recording: hasValidRecordingUrl, // อัปเดตตรงนี้
  };
};

export const CallsPage: React.FC = () => {
  const { user } = useAuth();
  const [allCalls, setAllCalls] = useState<CallDisplay[]>([]); // Store all fetched calls
  const [timeFilter, setTimeFilter] = useState<string>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCalls = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // ใช้ user.user_id จาก AuthContext
        const response = await callsService.getCalls(user.user_id, timeFilter, { limit: 100 }); // Fetch more initially, or implement pagination
        const displayCalls: CallDisplay[] = response.items.map(mapCallLogToDisplay);
        setAllCalls(displayCalls); // Store all fetched calls
      } catch (error) {
        console.error('Failed to load calls:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCalls();
  }, [user, timeFilter]); // Dependency array includes user

  // Filter calls based on searchTerm from the stored list
  const filteredCalls = allCalls.filter(call => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      (call.callerName && call.callerName.toLowerCase().includes(lowerSearchTerm)) ||
      call.callerNumber.includes(searchTerm) || // Check number directly
      (call.summary && call.summary.toLowerCase().includes(lowerSearchTerm)) // Search summary
    );
  });

  // --- Handlers for CallItem actions (Keep as examples) ---
  const handleListenRecording = (callId: string) => {
    // Note: The play button was removed from CallItem in the previous step.
    // If you want playback functionality here, you'd navigate to CallDetailPage
    // or implement a modal player. For now, this function might not be directly used
    // by CallItem, but CallList still accepts it.
    console.log(`Listen recording action triggered for call ${callId}, navigate to detail page.`);
    // Example navigation (if using useNavigate hook from react-router-dom):
    // navigate(`/calls/${callId}`);
  };
  const handleCallback = (callNumber: string) => {
    alert(`Calling back ${callNumber}. (Implement actual call logic)`);
  };
  const handleAddToWhitelist = (callNumber: string) => {
    // TODO: Implement actual API call using contactsService.updateContact
    alert(`Added ${callNumber} to whitelist. (Implement backend update)`);
    // Optimistically update UI or refetch data
  };
  const handleAddToBlacklist = (callNumber: string) => {
     // TODO: Implement actual API call using contactsService.updateContact
    alert(`Added ${callNumber} to blacklist. (Implement backend update)`);
     // Optimistically update UI or refetch data
  };
  // -----------------------------------------------------------

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Call Logs</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Input
          placeholder="Search name, number, summary..." // Update placeholder
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftIcon={<SearchIcon size={18} className="text-gray-500" />}
          className="md:max-w-xs"
          fullWidth
        />
        <div className="flex items-center">
          <label className="mr-2 text-sm font-medium">Time Period:</label>
          <select
            className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>
      <CallsList
        calls={filteredCalls} // Display filtered calls
        isLoading={isLoading}
        // Pass handlers down to CallsList (which passes them to CallItem if needed)
        onListenRecording={handleListenRecording} // Although button is removed, prop can still be passed
        onCallback={handleCallback}
        onAddToWhitelist={handleAddToWhitelist}
        onAddToBlacklist={handleAddToBlacklist}
      />
    </div>
  );
};
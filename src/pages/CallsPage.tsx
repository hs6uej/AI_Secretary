// src/pages/CallsPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallsList } from '../components/dashboard/CallsList';
import { CallDisplay, CallLog, CallType } from '../types/call'; // Import updated types
import { SearchIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';

// Helper function (same as in DashboardPage)
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

  return {
    id: call.call_id,
    callerName: call.caller_name || 'Unknown',
    callerNumber: call.caller_phone,
    timestamp: new Date(call.created_at).toLocaleString(),
    type: call.call_type,
    status: displayStatus,
    category: call.category,
    summary: call.summary || undefined,
    recording: true // Assumption
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
  }, [user, timeFilter]);

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

  const handleListenRecording = (callId: string) => {
    alert(`Playing recording for call ${callId}. (Functionality not available in n8n schema)`);
  };
  const handleCallback = (callNumber: string) => {
    alert(`Calling back ${callNumber}. (This would initiate a real call in a production app)`);
  };
  const handleAddToWhitelist = (callNumber: string) => {
    alert(`Added ${callNumber} to whitelist. (This would update the whitelist in a real app)`);
  };
  const handleAddToBlacklist = (callNumber: string) => {
    alert(`Added ${callNumber} to blacklist. (This would update the blacklist in a real app)`);
  };

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
        onListenRecording={handleListenRecording}
        onCallback={handleCallback}
        onAddToWhitelist={handleAddToWhitelist}
        onAddToBlacklist={handleAddToBlacklist}
      />
    </div>
  );
};
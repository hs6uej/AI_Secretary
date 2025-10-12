import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { CallsList } from '../components/dashboard/CallsList';
import { CallDisplay } from '../types/call';
import { SearchIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
export const CallsPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const [calls, setCalls] = useState<CallDisplay[]>([]);
  const [timeFilter, setTimeFilter] = useState<string>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const loadCalls = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const callLogs = await callsService.getCalls(user.user_id, timeFilter);
        // Transform call logs to display format
        const displayCalls: CallDisplay[] = callLogs.map(call => ({
          id: call.call_id,
          callerName: call.caller_name || 'Unknown',
          callerNumber: call.caller_phone,
          timestamp: new Date(call.created_at).toLocaleString(),
          type: call.call_type,
          // Map status from database to UI status
          status: call.status === 'completed' ? call.call_type === 'missed' ? 'missed' : 'answered' : 'voicemail',
          category: call.category,
          summary: call.summary || undefined,
          recording: true // Assuming all calls have recordings
        }));
        setCalls(displayCalls);
      } catch (error) {
        console.error('Failed to load calls:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCalls();
  }, [user, timeFilter]);
  const filteredCalls = calls.filter(call => {
    if (!searchTerm) return true;
    return call.callerName && call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) || call.callerNumber.includes(searchTerm);
  });
  const handleListenRecording = (callId: string) => {
    alert(`Playing recording for call ${callId}. (This would play the actual recording in a real app)`);
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
  return <div>
      <h1 className="text-2xl font-semibold mb-6">Call Logs</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Input placeholder="Search calls..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<SearchIcon size={18} className="text-gray-500" />} className="md:max-w-xs" fullWidth />
        <div className="flex items-center">
          <label className="mr-2 text-sm font-medium">Time Period:</label>
          <select className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>
      <CallsList calls={filteredCalls} isLoading={isLoading} onListenRecording={handleListenRecording} onCallback={handleCallback} onAddToWhitelist={handleAddToWhitelist} onAddToBlacklist={handleAddToBlacklist} />
    </div>;
};
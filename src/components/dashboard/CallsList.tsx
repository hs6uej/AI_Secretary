import React from 'react';
import { CallItem } from './CallItem';
import { CallDisplay } from '../../types/call';
interface CallsListProps {
  calls: CallDisplay[];
  isLoading?: boolean;
  onListenRecording?: (callId: string) => void;
  onCallback?: (callNumber: string) => void;
  onAddToWhitelist?: (callNumber: string) => void;
  onAddToBlacklist?: (callNumber: string) => void;
}
export const CallsList: React.FC<CallsListProps> = ({
  calls,
  isLoading = false,
  onListenRecording,
  onCallback,
  onAddToWhitelist,
  onAddToBlacklist
}) => {
  if (isLoading) {
    return <div className="bg-white rounded-lg shadow p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>;
  }
  if (calls.length === 0) {
    return <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No calls found</p>
      </div>;
  }
  return <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="divide-y">
        {calls.map(call => <CallItem key={call.id} call={call} onListenRecording={onListenRecording} onCallback={onCallback} onAddToWhitelist={onAddToWhitelist} onAddToBlacklist={onAddToBlacklist} />)}
      </div>
    </div>;
};
export type { CallDisplay as Call };
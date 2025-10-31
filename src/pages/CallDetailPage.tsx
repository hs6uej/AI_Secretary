// src/pages/CallDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callsService } from '../services/callsService';
import { contactsService } from '../services/contactsService';
import { CallLog, CallSegment, SpeakerRole } from '../types/call';
import {
  ArrowLeftIcon, PhoneIcon, PlayIcon, PauseIcon, DownloadIcon, UserIcon, BotIcon,
  CheckCircleIcon, XCircleIcon, HelpCircleIcon, Edit2Icon, SaveIcon, XIcon,
  RefreshCwIcon, AlertTriangleIcon
} from 'lucide-react';
import { format } from 'date-fns';

let currentAudio: HTMLAudioElement | null = null;

const formatSegmentTime = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
};

const formatMMSS = (sec: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const CallDetailPage: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const { user } = useAuth();
  const [call, setCall] = useState<CallLog | null>(null);
  const [segments, setSegments] = useState<CallSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Audio Controls (NEW)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

  // Editing state
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!callId) {
      setError('No call ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchCallDetails = async () => {
      setIsLoading(true);
      setError(null);
      setAudioError(null);
      try {
        const data = await callsService.getCallDetails(callId);
        setCall(data);
        setSegments(data.segments || []);
        setNewName(data.caller_name || 'Unknown Caller');
      } catch (err) {
        console.error('Failed to fetch call details:', err);
        setError('Failed to load call details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCallDetails();

    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
      }
    };
  }, [callId]);

  const handlePlayAudio = async () => {
    if (!callId) return;

    // Pause if currently playing
    if (currentAudio && isPlaying) {
      currentAudio.pause();
      setIsPlaying(false);
      return;
    }

    // Resume if paused
    if (currentAudio && !isPlaying) {
      try {
        await currentAudio.play();
        setIsPlaying(true);
      } catch (e) {
        console.error('Resume play failed:', e);
        currentAudio = null;
        handlePlayAudio();
      }
      return;
    }

    // Start fresh
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    setIsPlaying(true);
    setAudioError(null);

    try {
      const audioData = await callsService.getCallAudio(callId);
      const audioSrc = `data:${audioData.mimeType};base64,${audioData.data}`;
      currentAudio = new Audio(audioSrc);

      currentAudio.onloadedmetadata = () => {
        const d = isFinite(currentAudio!.duration) ? currentAudio!.duration : 0;
        setDuration(d);
      };
      currentAudio.ontimeupdate = () => {
        if (!isSeeking) setCurrentTime(currentAudio!.currentTime || 0);
      };
      currentAudio.onplay = () => setIsPlaying(true);
      currentAudio.onpause = () => setIsPlaying(false);
      currentAudio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        currentAudio = null;
      };
      currentAudio.onerror = () => {
        setAudioError('Failed to play audio.');
        setIsPlaying(false);
        currentAudio = null;
      };

      currentAudio.volume = volume;

      await currentAudio.play();
    } catch (err) {
      console.error('Failed to play audio:', err);
      setAudioError('Failed to fetch or play audio.');
      setIsPlaying(false);
      currentAudio = null;
    }
  };

  // Seek / Volume handlers
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentAudio) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    currentAudio.currentTime = newTime;
  };
  const handleSeekStart = () => setIsSeeking(true);
  const handleSeekEnd = () => setIsSeeking(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (currentAudio) currentAudio.volume = newVol;
  };

  const handleSaveName = async () => {
    if (!user || !call) return;
    setIsSaving(true);
    setError(null);
    try {
      const updatedContact = await contactsService.updateContact(
        user.user_id,
        call.caller_phone,
        { caller_name: newName }
      );
      setCall(prev => prev ? { ...prev, caller_name: updatedContact.caller_name } : null);
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to save name:', err);
      setError('Failed to save name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetStatus = async (status: 'WHITELISTED' | 'BLACKLISTED' | 'UNKNOWN') => {
    if (!user || !call || call.contact_status === status || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const updatedContact = await contactsService.updateContact(
        user.user_id,
        call.caller_phone,
        { status }
      );
      setCall(prev => prev ? { ...prev, contact_status: updatedContact.status } : null);
    } catch (err) {
      console.error('Failed to set status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getSpeakerIcon = (speaker: SpeakerRole) => {
    return speaker === 'ai'
      ? <BotIcon className="w-5 h-5 text-primary flex-shrink-0" />
      : <UserIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />;
  };

  const getContactStatusIcon = (status: 'WHITELISTED' | 'BLACKLISTED') => {
    return status === 'WHITELISTED'
      ? <CheckCircleIcon className="w-5 h-5 text-success" />
      : <XCircleIcon className="w-5 h-5 text-destructive" />;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <RefreshCwIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <AlertTriangleIcon className="w-8 h-8 mx-auto mb-2" />
        <p>{error}</p>
        <Link to="/calls" className="text-primary hover:underline mt-4 inline-block">
          Back to Call Logs
        </Link>
      </div>
    );
  }

  if (!call) {
    return <div className="p-6 text-center text-gray-500">Call not found.</div>;
  }

  const callTime = format(new Date(call.created_at), 'PP, p');
  const callDurationLabel = duration > 0 ? formatMMSS(duration) : '01:19';

  return (
    <div className="p-4 md:p-6">
      <Link to="/calls" className="flex items-center text-sm text-primary hover:underline mb-4">
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Call Logs
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          {!isEditingName ? (
            <div className="flex items-center group">
              <h1 className="text-2xl font-semibold mr-2">{call.caller_name || 'Unknown Caller'}</h1>
              <button
                onClick={() => {
                  setNewName(call.caller_name || '');
                  setIsEditingName(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary"
                title="Edit name"
              >
                <Edit2Icon size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-2xl font-semibold p-1 border rounded-md"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={isSaving}
                className="p-1 text-success disabled:text-gray-400 ml-2"
                title="Save"
              >
                {isSaving ? <RefreshCwIcon size={18} className="animate-spin" /> : <SaveIcon size={18} />}
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                disabled={isSaving}
                className="p-1 text-destructive disabled:text-gray-400 ml-1"
                title="Cancel"
              >
                <XIcon size={18} />
              </button>
            </div>
          )}

          <div className="text-gray-500">{call.caller_phone}</div>
          <div className="text-sm text-gray-500 mt-1">
            {callTime} &bull; {call.call_type} &bull; {call.category_description || 'N/A'}
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => handleSetStatus(call.contact_status === 'WHITELISTED' ? 'UNKNOWN' : 'WHITELISTED')}
            className={`flex items-center px-3 py-1.5 rounded-full text-sm border ${
              call.contact_status === 'WHITELISTED'
                ? 'bg-success-100 border-success text-success-800'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isSaving}
          >
            {getContactStatusIcon('WHITELISTED')}
            Whitelist
          </button>
          <button
            onClick={() => handleSetStatus(call.contact_status === 'BLACKLISTED' ? 'UNKNOWN' : 'BLACKLISTED')}
            className={`flex items-center px-3 py-1.5 rounded-full text-sm border ${
              call.contact_status === 'BLACKLISTED'
                ? 'bg-destructive-100 border-destructive text-destructive-800'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isSaving}
          >
            {getContactStatusIcon('BLACKLISTED')}
            Blacklist
          </button>
        </div>
      </div>

      {/* Audio Player */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between mb-6 border">
        <div className="flex items-center w-full md:w-auto">
          <button
            onClick={handlePlayAudio}
            disabled={!call.voice_log}
            className="p-2 rounded-full bg-primary text-white hover:bg-primary-700 disabled:bg-gray-300"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>

          {/* Controls & States */}
          <div className="flex flex-col w-full md:w-[420px] ml-4">
            {/* Seek */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="0.01"
              value={Math.min(currentTime, duration || 0)}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onChange={handleSeek}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="w-full accent-primary"
              disabled={!call.voice_log}
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{formatMMSS(currentTime)}</span>
              <span>{formatMMSS(duration)}</span>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-28 accent-primary"
                disabled={!call.voice_log}
              />
            </div>
          </div>
        </div>

        {audioError && <span className="text-destructive text-sm mt-3 md:mt-0">{audioError}</span>}

        <a
          href={call.voice_log || '#'}
          download={`call_${callId}.wav`}
          className={`flex items-center text-sm text-primary hover:underline mt-3 md:mt-0 ${!call.voice_log ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e) => !call.voice_log && e.preventDefault()}
          title="Download audio"
        >
          <DownloadIcon size={16} className="mr-1" />
          Download
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Summary (TH)</h3>
          <p className="text-sm text-gray-700">{call.summary || 'N/A'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Call Outcome</h3>
          <p className="text-sm text-gray-700 capitalize">{call.call_outcome || 'N/A'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Intent & Confidence</h3>
          <p className="text-sm text-gray-700 capitalize">{call.intent || 'N/A'}</p>
          <p className="text-sm text-gray-700">Score: {Number(call.confidence || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Spam Risk</h3>
          <p className="text-sm text-gray-700">Score: {Number(call.spam_risk_score || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-700">{call.spam_risk_reason || 'No reason provided'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Summary (EN)</h3>
          <p className="text-sm text-gray-700">{call.sms_summary_en || 'N/A'}</p>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-lg font-medium mb-4">Conversation Log</h2>
        {segments.length === 0 ? (
          <p className="text-gray-500">No conversation log available for this session.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {segments.map(segment => (
              <div
                key={segment.segment_id}
                className={`flex items-start gap-2 ${segment.speaker === 'human' ? '' : 'justify-end'}`}
              >
                {segment.speaker === 'human' && (
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-1"
                    title="Caller"
                  >
                    <UserIcon size={16} className="text-blue-600" />
                  </span>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[80%] ${
                    segment.speaker === 'human'
                      ? 'bg-blue-50 text-blue-900'
                      : 'bg-primary/10 text-primary-dark'
                  }`}
                >
                  {typeof segment.text === 'string' &&
                  segment.text.startsWith('{') &&
                  segment.text.endsWith('}') ? (
                    (() => {
                      try {
                        const parsed = JSON.parse(segment.text);
                        return (
                          <pre className="text-xs whitespace-pre-wrap font-sans">
                            {parsed.response || JSON.stringify(parsed, null, 2)}
                          </pre>
                        );
                      } catch {
                        return (
                          <div className="text-gray-800 whitespace-pre-wrap">
                            {segment.text}
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {segment.text || '(No content)'}
                    </div>
                  )}
                </div>
                {segment.speaker === 'ai' && (
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-1"
                    title="AI Secretary"
                  >
                    <BotIcon size={16} className="text-green-600" />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Wand2,
  CheckCircle,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Flame,
} from 'lucide-react';
import { VideoStyleSettings, StoryTreatment, ScenePrompt, TimestampLine, AspectRatio, VideoDurationMode } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  appliedActions?: any[];
}

interface AiDirectorChatProps {
  currentVideoState: {
    styleSettings: VideoStyleSettings;
    story: StoryTreatment | null;
    scenes: ScenePrompt[];
    lyrics: TimestampLine[];
    songTitle: string;
    artistName: string;
    durationMode: VideoDurationMode;
  };
  onApplyStyleEdit: (updatedStyle: Partial<VideoStyleSettings>) => void;
  onApplySceneEdit: (sceneNumber: number, updatedScene: Partial<ScenePrompt>) => void;
  onApplyDurationMode: (mode: VideoDurationMode) => void;
  onApplyTitleEdit: (title: string) => void;
}

export const AiDirectorChat: React.FC<AiDirectorChatProps> = ({
  currentVideoState,
  onApplyStyleEdit,
  onApplySceneEdit,
  onApplyDurationMode,
  onApplyTitleEdit,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'model',
      text: "👋 Hi! I'm your **7clouds AI Video Director & VidIQ Copilot**. I can direct edits to your video in real-time AND query your connected **VidIQ MCP tools** (search volume, high-ranking titles, tags, and competitor insights)!\n\nTry asking me:\n- *\"VidIQ: Check monthly search volume for this song\"*\n- *\"VidIQ: Suggest 3 viral titles with CTR prediction and apply the best one\"*\n- *\"VidIQ: What is my SEO score and how do I optimize tags?\"*\n- *\"Make the lyrics bigger with a soft cyan glow\"*\n- *\"Switch to 9:16 vertical Shorts format\"*\n- *\"Set video length to 30 seconds\"*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'VidIQ: Check search volume for this song',
    'VidIQ: Suggest viral titles & apply best one',
    'VidIQ: Audit my SEO score',
    'Make lyrics larger with cyan glow',
    'Switch to 9:16 Shorts format',
    'Set duration to 30-second teaser',
    'Apply The Fray Rainy Dusk aesthetic',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          currentVideoState,
        }),
      });

      if (!res.ok) throw new Error('Failed to reach AI Director');
      const data = await res.json();

      // Execute returned actions on the video state!
      const executed: any[] = [];
      if (Array.isArray(data.actions)) {
        for (const action of data.actions) {
          if (action.type === 'UPDATE_STYLE' && action.payload) {
            onApplyStyleEdit(action.payload);
            executed.push(`Updated style: ${Object.keys(action.payload).join(', ')}`);
          } else if (action.type === 'SET_ASPECT_RATIO' && action.payload) {
            onApplyStyleEdit({ aspectRatio: action.payload as AspectRatio });
            executed.push(`Set aspect ratio to ${action.payload}`);
          } else if (action.type === 'SET_DURATION_MODE' && action.payload) {
            onApplyDurationMode(action.payload as VideoDurationMode);
            executed.push(`Set duration mode to ${action.payload}`);
          } else if (action.type === 'UPDATE_SCENE' && action.payload) {
            onApplySceneEdit(action.payload.sceneNumber, action.payload);
            executed.push(`Updated Scene ${action.payload.sceneNumber}`);
          } else if (action.type === 'UPDATE_TITLE' && action.payload) {
            onApplyTitleEdit(action.payload);
            executed.push(`Updated title to "${action.payload}"`);
          }
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.reply || "I've applied your edits to the video!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedActions: executed,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat editor error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'model',
          text: `⚠️ Error applying edit: ${err.message || 'Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl transition-all">
      {/* Header bar */}
      <div className="p-4 px-5 bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                AI Video Director Copilot
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400">
              Tell me edits in plain English • I apply them directly to your video!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>VidIQ MCP Live</span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand chat' : 'Collapse chat'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col h-[420px]">
          {/* Scrollable Message Thread */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20 font-medium'
                      : 'bg-slate-950 border border-slate-800/90 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>

                  {/* Actions applied badge */}
                  {m.appliedActions && m.appliedActions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      {m.appliedActions.map((act, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20"
                        >
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[9px] font-mono ${
                      m.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-500 text-left'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-2">
                  <span>AI Director is analyzing and applying your edit...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-4 py-2 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-950/40">
            <span className="text-[10px] text-slate-500 uppercase font-bold flex-shrink-0">
              Suggestions:
            </span>
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp)}
                disabled={isSending}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/60 hover:border-indigo-500/40 text-[11px] text-slate-300 whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer disabled:opacity-40"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 px-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 'Make lyrics font Bebas Neue and size 52px', 'Switch to 9:16 Shorts'..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

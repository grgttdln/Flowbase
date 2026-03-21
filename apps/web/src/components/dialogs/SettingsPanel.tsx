'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { testConnection, DEFAULT_MODEL } from '@flowbase/ai';
import { getAISettings, setAISettings } from '@/hooks/useAIAction';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  hint?: string;
}

const SettingsPanel = ({ open, onClose, hint }: SettingsPanelProps) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  useEffect(() => {
    if (open) {
      const settings = getAISettings();
      setApiKey(settings.apiKey);
      setModel(settings.model);
      setTestStatus('idle');
    }
  }, [open]);

  const handleSave = () => {
    setAISettings({ apiKey, model });
    onClose();
  };

  const handleTest = async () => {
    setTestStatus('testing');
    const ok = await testConnection(apiKey, model);
    setTestStatus(ok ? 'success' : 'failed');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="w-[420px] rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F0F0] px-5 py-3.5">
          <span className="text-[15px] font-semibold text-[#1C1C1E]">AI Settings</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#999] transition-colors hover:bg-black/[0.04] hover:text-[#666]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {hint && (
            <div className="rounded-lg bg-[#FFF8E1] px-3 py-2 text-[13px] text-[#8B6914]">
              {hint}
            </div>
          )}

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#333]">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="sk-or-..."
              className="w-full rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-[13px] text-[#333] outline-none transition-colors placeholder:text-[#BBB] focus:border-[#007AFF]"
            />
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#333]">
              Model
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setTestStatus('idle');
              }}
              placeholder={DEFAULT_MODEL}
              className="w-full rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-[13px] font-mono text-[#333] outline-none transition-colors placeholder:text-[#BBB] focus:border-[#007AFF]"
            />
            <p className="text-[11px] text-[#999]">
              Any OpenRouter model ID. Default: {DEFAULT_MODEL}
            </p>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={!apiKey || testStatus === 'testing'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F5F5] px-3 py-1.5 text-[13px] font-medium text-[#333] transition-colors hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testStatus === 'testing' && <Loader2 size={13} className="animate-spin" />}
              Test Connection
            </button>
            {testStatus === 'success' && (
              <span className="inline-flex items-center gap-1 text-[12px] text-green-600">
                <CheckCircle2 size={13} /> Connected
              </span>
            )}
            {testStatus === 'failed' && (
              <span className="inline-flex items-center gap-1 text-[12px] text-red-500">
                <XCircle size={13} /> Failed
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#F0F0F0] px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-[#666] transition-colors hover:bg-black/[0.04]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-[#007AFF] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0066DD]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

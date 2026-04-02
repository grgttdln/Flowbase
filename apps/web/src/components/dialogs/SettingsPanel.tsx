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
        <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-3.5">
          <span className="text-[15px] font-semibold text-[#18181b]">AI Settings</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#a1a1aa] transition-colors hover:bg-black/[0.04] hover:text-[#52525b]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {hint && (
            <div className="rounded-lg bg-[#fefce8] px-3 py-2 text-[13px] text-[#92400e]">
              {hint}
            </div>
          )}

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#18181b]">
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
              className="w-full rounded-lg border border-[#e4e4e7] bg-white px-3 py-2 text-[13px] text-[#18181b] outline-none transition-colors placeholder:text-[#a1a1aa] focus:border-[#7c3aed]"
            />
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#18181b]">
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
              className="w-full rounded-lg border border-[#e4e4e7] bg-white px-3 py-2 text-[13px] font-mono text-[#18181b] outline-none transition-colors placeholder:text-[#a1a1aa] focus:border-[#7c3aed]"
            />
            <p className="text-[11px] text-[#a1a1aa]">
              Any OpenRouter model ID. Default: {DEFAULT_MODEL}
            </p>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={!apiKey || testStatus === 'testing'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#fafafa] px-3 py-1.5 text-[13px] font-medium text-[#18181b] transition-colors hover:bg-[#e4e4e7] disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="flex justify-end gap-2 border-t border-[#e4e4e7] px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-[#52525b] transition-colors hover:bg-black/[0.04]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-[#7c3aed] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#6d28d9]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

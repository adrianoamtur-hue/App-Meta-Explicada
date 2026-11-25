import React from 'react';
import { Mic, X } from 'lucide-react';
import type { UniversalVoiceParsed } from '../types';
import { VoiceDiaryPanel } from './VoiceDiaryPanel';

interface UniversalVoiceModalProps {
  isOpen: boolean;
  todayIso: string;
  defaultLumbar: number;
  latestWeightKg?: number;
  onClose: () => void;
  onConfirmAll: (payload: UniversalVoiceParsed) => void;
  onOpenManualEntry?: () => void;
}

export const UniversalVoiceModal: React.FC<UniversalVoiceModalProps> = ({
  isOpen,
  todayIso,
  defaultLumbar,
  latestWeightKg,
  onClose,
  onConfirmAll,
  onOpenManualEntry,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Falar meu dia — Diário por Voz"
      className="no-print fixed inset-0 z-50 bg-[#06283D]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-2xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white border border-[#E5E0D5] text-[#06283D] shadow-2xl">
        <div className="sm:hidden w-10 h-1.5 bg-[#D4CEC2] rounded-full mx-auto mt-3" />

        <div className="sticky top-0 z-10 bg-white px-5 pt-4 pb-3 border-b border-[#E5E0D5] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#06283D] text-[#7FDAD0] flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base text-[#06283D] truncate">
                Falar meu dia (Diário por Voz)
              </h2>
              <p className="text-[11px] text-[#5B7689] truncate">
                Sem limite de tempo — o app guia os tópicos e salva tudo no banco de dados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar diário por voz"
            className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-[#F8F6F1] flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <VoiceDiaryPanel
            todayIso={todayIso}
            defaultLumbar={defaultLumbar}
            latestWeightKg={latestWeightKg}
            onConfirmAll={onConfirmAll}
            onOpenManualEntry={
              onOpenManualEntry
                ? () => {
                    onClose();
                    onOpenManualEntry();
                  }
                : undefined
            }
            afterSave={onClose}
          />
        </div>
      </div>
    </div>
  );
};

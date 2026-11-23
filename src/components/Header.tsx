import React, { useRef, useState } from 'react';
import { Camera, Download, FileText, Share, X } from 'lucide-react';
import type { Stance } from '../types';
import { DEFAULT_LOGO_PATH, TOTAL_PROJECT_DAYS, getProjectProgress } from '../utils/logic';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  logoDataUrl: string | null;
  onLogoChange: (dataUrl: string) => void;
  stance: Stance;
  onStanceChange: (stance: Stance) => void;
  onOpenPilatesDossier: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  logoDataUrl,
  onLogoChange,
  stance,
  onStanceChange,
  onOpenPilatesDossier,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progress = getProjectProgress();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const logoSrc = logoDataUrl || DEFAULT_LOGO_PATH;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLogoChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      {/* Compact Sticky Top Bar (~56px) */}
      <header className="no-print sticky top-0 z-30 bg-[#06283D]/95 backdrop-blur-md text-white border-b border-white/10 pt-safe">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand Emblem + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Trocar foto do emblema Meta Explicada"
              title="Toque para trocar a logo (salva no aparelho)"
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#00A896] bg-[#F8F6F1] shrink-0 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A896]"
            >
              <img
                src={logoSrc}
                alt="Emblema Meta Explicada"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-[#06283D]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" aria-hidden="true" />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Selecionar imagem da logo"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm sm:text-base tracking-tight text-white truncate">
                  Operação Maldivas
                </span>
                <span className="hidden sm:inline text-white/40" aria-hidden="true">·</span>
                <span className="hidden sm:inline font-mono text-xs font-semibold text-[#7FDAD0] tabular-nums whitespace-nowrap">
                  DIA {String(progress.currentDay).padStart(2, '0')} / {TOTAL_PROJECT_DAYS}
                </span>
              </div>
              <p className="text-[11px] text-[#7FDAD0] font-mono tabular-nums whitespace-nowrap sm:hidden">
                @metaexplicada · DIA {String(progress.currentDay).padStart(2, '0')}/{TOTAL_PROJECT_DAYS}
              </p>
            </div>
          </div>

          {/* Right Actions: Optional PWA Install + Fixed PDF Pilates Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={install}
                className="min-h-[40px] px-2.5 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}
            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="min-h-[40px] px-2.5 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Share className="w-3.5 h-3.5" aria-hidden="true" />
                <span>iPhone</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPilatesDossier}
              className="min-h-[40px] px-3 sm:px-3.5 rounded-xl bg-[#00A896] hover:bg-[#009282] active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>PDF Pilates</span>
            </button>
          </div>
        </div>
      </header>

      {/* Non-sticky Identity, Countdown, 3-Phase Progress & Stance Ribbon */}
      <section
        aria-label="Progresso do Projeto 273 Dias"
        className="no-print bg-[#06283D] text-white border-b border-[#0B3B59]"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Circular Emblem Identity & Dynamic Countdown */}
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Trocar imagem do emblema circular Meta Explicada"
                className="hidden sm:block w-14 h-14 rounded-full overflow-hidden border-2 border-[#00A896] bg-[#F8F6F1] shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <img
                  src={logoSrc}
                  alt="Logo Meta Explicada — Movimento Sem Dor"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] text-[#7FDAD0] font-medium leading-snug">
                  META EXPLICADA — PROJETO 273 DIAS · MAIS FORÇA, MOVIMENTO, SAÚDE E LIBERDADE · RUMO ÀS MALDIVAS
                </p>
                <div className="mt-1.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-y-0.5 sm:gap-x-3 text-sm">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono font-bold text-white tabular-nums text-base">
                      DIA {String(progress.currentDay).padStart(2, '0')} / {TOTAL_PROJECT_DAYS}
                    </span>
                    <span className="text-white/40" aria-hidden="true">·</span>
                    <span className="font-mono text-xs text-white/90 tabular-nums">
                      Faltam {progress.daysRemaining} dias (01/08/2027)
                    </span>
                  </div>
                  <span className="hidden sm:inline text-white/40" aria-hidden="true">·</span>
                  <span className="text-xs text-[#7FDAD0] font-semibold">
                    Fase {progress.phaseIndex}: {progress.phaseName}
                  </span>
                </div>
              </div>
            </div>

            {/* Stance Selector (Regular / Goofy) */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="text-xs text-white/75 whitespace-nowrap">Base no surf:</span>
              <div
                role="group"
                aria-label="Selecionar base do surf"
                className="inline-flex items-center p-1 rounded-xl bg-white/10 border border-white/10"
              >
                {(['Regular', 'Goofy'] as Stance[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onStanceChange(option)}
                    aria-pressed={stance === option}
                    className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      stance === option
                        ? 'bg-white text-[#06283D]'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3-Phase Visual Progress Bar */}
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { idx: 1, range: 'Meses 1–3', title: 'Base & Desbloqueio', shortTitle: 'Base & Desbloq.' },
                { idx: 2, range: 'Meses 4–6', title: 'Força & Borda', shortTitle: 'Força & Borda' },
                { idx: 3, range: 'Meses 7–9', title: 'Polimento & Resistência', shortTitle: 'Polimento' },
              ].map((phase) => {
                const isPast = progress.phaseIndex > phase.idx;
                const isActive = progress.phaseIndex === phase.idx;
                const phaseStartDay = (phase.idx - 1) * 91 + 1;
                const phaseProgress = isPast
                  ? 100
                  : isActive
                    ? Math.max(4, Math.min(100, Math.round(((progress.currentDay - phaseStartDay + 1) / 91) * 100)))
                    : 0;
                return (
                  <div key={phase.idx} className="min-w-0">
                    <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isActive ? 'bg-[#00A896]' : isPast ? 'bg-[#1363DF]' : 'bg-transparent'
                        }`}
                        style={{ width: `${phaseProgress}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between gap-1 text-[11px]">
                      <span className={`font-medium whitespace-nowrap ${isActive ? 'text-white' : 'text-white/65'}`}>
                        <span className="sm:hidden">{phase.shortTitle}</span>
                        <span className="hidden sm:inline">{phase.title}</span>
                      </span>
                      <span className="hidden sm:inline font-mono text-[10px] text-white/55 whitespace-nowrap">
                        {phase.range}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* iOS Safari Add-to-Home-Screen Guide Modal */}
      {showIOSGuide && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 border border-[#E5E0D5] text-[#06283D]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-lg">Instalar no iPhone (PWA)</h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Fechar guia iOS"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#F8F6F1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="mt-3 space-y-2.5 text-sm text-[#335368] list-decimal list-inside">
              <li>Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari.</li>
              <li>Role as opções e toque em <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Toque em <strong>Adicionar</strong> para abrir o Operação Maldivas em tela cheia.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#06283D] text-white text-sm font-semibold"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

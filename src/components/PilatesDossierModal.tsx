import React from 'react';
import { Printer, X, ExternalLink } from 'lucide-react';
import { DEFAULT_LOGO_PATH, TOTAL_PROJECT_DAYS, getProjectProgress } from '../utils/logic';
import type { Stance } from '../types';

interface PilatesDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoDataUrl: string | null;
  stance: Stance;
}

export const PilatesDossierModal: React.FC<PilatesDossierModalProps> = ({
  isOpen,
  onClose,
  logoDataUrl,
  stance,
}) => {
  if (!isOpen) return null;
  const progress = getProjectProgress();
  const logoSrc = logoDataUrl || DEFAULT_LOGO_PATH;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dossiê Clínico para Professora de Pilates"
      className="fixed inset-0 z-50 bg-[#06283D]/70 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex justify-center items-start print-only-container"
    >
      <div className="w-full max-w-[210mm] bg-white rounded-2xl border border-[#E5E0D5] text-[#06283D] shadow-xl overflow-hidden print-only-container">
        {/* Top Modal Action Bar (hidden when printing) */}
        <div className="no-print sticky top-0 z-10 bg-[#06283D] text-white px-5 py-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="font-display font-bold text-sm sm:text-base">
              Dossiê Clínico A4 — Professora de Pilates
            </p>
            <p className="text-xs text-white/75">
              Pronto para salvar em PDF e enviar pelo WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-4 rounded-xl bg-[#00A896] hover:bg-[#009282] text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar dossiê clínico"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Content */}
        <article className="p-6 sm:p-10 space-y-6 text-[13.5px] leading-relaxed">
          {/* Document Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E0D5]">
            <div className="flex items-center gap-4">
              <img
                src={logoSrc}
                alt="Meta Explicada"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#06283D] bg-[#F8F6F1] shrink-0"
              />
              <div>
                <p className="text-xs font-bold tracking-wide text-[#1363DF]">
                  DOSSIÊ CLÍNICO &amp; BIOMECÂNICO PARA PILATES
                </p>
                <h1 className="font-display text-2xl font-extrabold text-[#06283D] mt-0.5">
                  Operação Maldivas — Projeto 273 Dias
                </h1>
                <p className="text-xs text-[#4A6578] mt-1">
                  Objetivo: Viagem de surf às Maldivas (01/08/2027) · Base: {stance} · Dia {String(progress.currentDay).padStart(2, '0')}/{TOTAL_PROJECT_DAYS}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right text-xs font-mono text-[#4A6578] shrink-0">
              <p className="font-bold text-[#06283D]">RM Lombar: 03/02/2026</p>
              <p>Perfil: @metaexplicada</p>
              <p>Foco: Proteção L4–S1 + Mobilidade</p>
            </div>
          </header>

          {/* Note to Instructor */}
          <section className="rounded-xl bg-[#F8F6F1] p-4 border border-[#E5E0D5] print-break-avoid">
            <h2 className="font-display font-bold text-sm text-[#06283D]">
              Nota para a Professora de Pilates
            </h2>
            <p className="mt-1.5 text-[#284559]">
              Este documento foi preparado para facilitar a ponte entre seus 20 anos de experiência em Pilates clínico e as demandas biomecânicas do surf (sem necessidade de conhecimento prévio do esporte). O aluno surfa há 30 anos em linha reta e está em uma preparação de 9 meses para realizar curvas fluidas (cavadas, rasgadas e cutbacks) nas Maldivas protegendo 100% os segmentos L4-L5 e L5-S1.
            </p>
          </section>

          {/* 1. Clinical MRI Summary */}
          <section className="space-y-3 print-break-avoid">
            <h2 className="font-display font-bold text-base text-[#06283D] border-b border-[#E5E0D5] pb-1.5">
              1. Resumo Clínico Fiel — Ressonância Magnética Lombar (03/02/2026)
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E5E0D5] p-3.5">
                <p className="font-bold text-[#E63946] text-xs">SEGMENTO L5–S1 (CRÍTICO)</p>
                <p className="mt-1 text-[#1E3A4C]">
                  Degeneração espondilodiscal com <strong>pequena extrusão central e migração infrapedicular de 13 mm</strong>, fissura radial do ânulo fibroso e <strong>focos incipientes de Modic Tipo 1</strong> (inflamação reativa nas placas vertebrais — intolerância a impacto seco, saltos e privação de sono).
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E0D5] p-3.5">
                <p className="font-bold text-[#1363DF] text-xs">SEGMENTO L4–L5 &amp; ALINHAMENTO</p>
                <p className="mt-1 text-[#1E3A4C]">
                  Desidratação/redução de altura discal, fissura concêntrica e pequena protrusão central comprimindo o saco dural com <strong>sutil contato na raiz descendente direita de L5</strong>. Pequena <strong>retrolistese de L5</strong> (evitar hiperextensão lombar), retificação da lordose lombar e leve escoliose para a direita.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-[#FFF5F5] border border-[#E63946]/30 p-3.5 text-[#7F1D24]">
              <p className="font-bold text-xs">STATUS MÉDICO ATUAL &amp; REGRA PÓS-INFILTRAÇÃO</p>
              <p className="mt-1">
                Risco cirúrgico cardiológico aprovado (sem indicação cirúrgica). Aguardando liberação do convênio <strong>AMIL</strong> para infiltração de ácido hialurônico para controle da dor. <strong>Atenção:</strong> após a infiltração, o alívio da dor NÃO significa cicatrização instantânea do disco ou do Modic 1 — aproveitar a janela sem dor para consolidar estabilidade lombo-pélvica e glúteos mantendo todas as restrições abaixo.
              </p>
            </div>
          </section>

          {/* 2. Biomechanical Translation */}
          <section className="space-y-2.5 print-break-avoid">
            <h2 className="font-display font-bold text-base text-[#06283D] border-b border-[#E5E0D5] pb-1.5">
              2. Tradução Biomecânica do Surf para o Pilates (5 Pilares)
            </h2>
            <ol className="space-y-2 text-[#1E3A4C]">
              <li>
                <strong>1. Mobilidade Torácica Dissociada do Quadril:</strong> girar o tronco superior (olhar e ombros) mantendo a pelve estável — substitui a torção lombar perigosa durante curvas na onda. (Ex: Book Opening, Chest Expansion, rotação torácica com caixa/Cadillac).
              </li>
              <li>
                <strong>2. Rotação Interna e Externa de Quadril (90/90):</strong> permite agachar em base baixa e encolher o joelho traseiro sem puxar a lombar em flexão (evita retroversão pélvica).
              </li>
              <li>
                <strong>3. Dorsiflexão de Tornozelo:</strong> tornozelos móveis absorvem irregularidades da onda e permitem comprimir o centro de gravidade mantendo a coluna neutra.
              </li>
              <li>
                <strong>4. Estabilidade Lombo-Pélvica Anti-Extensão e Anti-Rotação:</strong> controle rigoroso de centro em coluna neutra — Dead Bug, Perdigueiro (Bird-Dog sem subir perna acima do quadril), Pallof Press nas molas, Prancha Lateral e Ponte de Glúteo controlada.
              </li>
              <li>
                <strong>5. Estabilização Escapular (Serrátil Anterior &amp; Trapézio Inferior):</strong> sustenta horas de remada no mar e o empurrão do pop-up sem sobrecarregar cervical nem hiperestender L5.
              </li>
            </ol>
          </section>

          {/* 3. Absolute Restrictions & Red Flags */}
          <section className="grid sm:grid-cols-2 gap-4 print-break-avoid">
            <div className="rounded-xl border border-[#E63946]/35 p-4">
              <h3 className="font-display font-bold text-sm text-[#E63946]">
                3. Restrições Absolutas (NÃO realizar)
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-[#1E3A4C] list-disc list-inside">
                <li>Flexão lombar repetida ou carregada (Roll-up, Teaser, Hundred tradicional, Crunch).</li>
                <li>Flexão combinada com rotação (Saw / Windmills / Criss-Cross / Russian Twist).</li>
                <li>Hiperextensão lombar acentuada (Swan Dive extremo, arco excessivo em prono — retrolistese L5).</li>
                <li>Impactos, saltos na Jumpboard ou compressão axial pesada em flexão (Modic Tipo 1).</li>
                <li>Alongamento posterior com queixo puxado ao peito (tensiona raiz direita de L5).</li>
              </ul>
            </div>
            <div className="rounded-xl border border-[#00A896]/40 p-4">
              <h3 className="font-display font-bold text-sm text-[#06283D]">
                4. Sinais de Alerta &amp; Referências
              </h3>
              <p className="mt-2 text-xs text-[#7F1D24] font-semibold">
                ALERTA VERMELHO: Qualquer dor irradiada, choque ou formigamento descendo pela PERNA DIREITA exige interrupção imediata de carga e foco em descompressão suave.
              </p>
              <div className="mt-3 space-y-1 text-xs">
                <p className="font-bold text-[#06283D]">Referências rápidas (YouTube):</p>
                <a
                  href="https://www.youtube.com/watch?v=LuePuoHEt6s"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#1363DF] underline"
                >
                  <span>Pallof Press (Anti-Rotação)</span>
                  <ExternalLink className="w-3 h-3 no-print" />
                </a>
                <a
                  href="https://www.youtube.com/watch?v=xJMpEiZ5q6c"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#1363DF] underline"
                >
                  <span>Mobilidade de Quadril 90/90</span>
                  <ExternalLink className="w-3 h-3 no-print" />
                </a>
                <a
                  href="https://www.youtube.com/watch?v=PLDCRU55LSU"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#1363DF] underline"
                >
                  <span>Rotação Torácica em 4 Apoios</span>
                  <ExternalLink className="w-3 h-3 no-print" />
                </a>
              </div>
            </div>
          </section>

          {/* 5. 3-Quarter Progression */}
          <section className="space-y-2.5 print-break-avoid">
            <h2 className="font-display font-bold text-base text-[#06283D] border-b border-[#E5E0D5] pb-1.5">
              5. Cronograma de Progressão em 3 Trimestres (Nov/2026 – Ago/2027)
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
                <p className="font-mono text-[11px] font-bold text-[#1363DF]">MESES 1–3 (NOV–FEV)</p>
                <p className="font-display font-bold text-sm mt-0.5">Base &amp; Desbloqueio</p>
                <p className="text-xs text-[#335368] mt-1">
                  Descompressão, respiração diafragmática, coluna neutra (Dead Bug/Bird-Dog/Pallof), mobilidade 90/90 de quadril, tornozelo e torácica.
                </p>
              </div>
              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
                <p className="font-mono text-[11px] font-bold text-[#00A896]">MESES 4–6 (MAR–MAI)</p>
                <p className="font-display font-bold text-sm mt-0.5">Força &amp; Borda</p>
                <p className="text-xs text-[#335368] mt-1">
                  Progressão unilateral de membros inferiores nas molas (Reformer/Chair em coluna neutra), glúteo médio, anti-rotação com maior carga e serrátil.
                </p>
              </div>
              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
                <p className="font-mono text-[11px] font-bold text-[#06283D]">MESES 7–9 (JUN–AGO)</p>
                <p className="font-display font-bold text-sm mt-0.5">Polimento &amp; Resistência</p>
                <p className="text-xs text-[#335368] mt-1">
                  Resistência isométrica de pernas (base de surf), rotação torácica fluida sob fadiga leve, controle escapular para 3h/dia de surf nas Maldivas.
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

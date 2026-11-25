export interface VideoLink {
  label: string;
  url: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  prescription: string;
  setsCount: number;
  surfPurpose: string;
  l4s1Shield: string;
  videos: VideoLink[];
}

export type ChineseFlowStatus = 'liberado' | 'adaptado' | 'substituido';

export interface ChineseFlowStep {
  index: number;
  id: string;
  name: string;
  status: ChineseFlowStatus;
  statusLabel: string;
  surfBridge: string;
  instruction: string;
  videoUrl?: string;
  videoLabel?: string;
}

export interface ManeuverCard {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  mainVideoUrl: string;
  mainVideoLabel: string;
  extraVideos: VideoLink[];
  watchFor: string;
  drylandDrill: string;
  l4s1Shield: string;
}

export interface EliteLesson {
  id: string;
  title: string;
  duration: string;
  coach: string;
  videos: VideoLink[];
  focus: string;
  adaptations: string[];
}

export const ACADEMIA_A_EXERCISES: ExerciseItem[] = [
  {
    id: 'acad-a-bulgaro',
    name: 'Agachamento Búlgaro',
    prescription: '3×10 cada perna',
    setsCount: 3,
    surfPurpose:
      'Força unilateral de perna dianteira e traseira para comprimir na cavada (Bottom Turn) e sustentar a borda em ondas longas das Maldivas.',
    l4s1Shield:
      'Mantém metade da carga na coluna comparado ao agachamento livre com barra. Use halteres nas mãos, tronco levemente inclinado em bloco (coluna neutra) sem arredondar lombar.',
    videos: [
      { label: 'Ver Búlgaro Seguro', url: 'https://www.youtube.com/watch?v=v-bItsW7fUI' },
    ],
  },
  {
    id: 'acad-a-pelvica',
    name: 'Elevação Pélvica no Banco (Hip Thrust)',
    prescription: '3×12 controladas',
    setsCount: 3,
    surfPurpose:
      'Ativa glúteo máximo para impulsionar o quadril nas rasgadas e proteger a base durante 3 horas de surf no recife.',
    l4s1Shield:
      'Olhar sempre à frente (queixo levemente recolhido) e costelas travadas. NUNCA hiperestender a lombar no topo (retrolistese de L5 exige subir só até alinhar tronco e coxas).',
    videos: [
      { label: 'Ver Elevação Pélvica', url: 'https://www.youtube.com/watch?v=TJgWb0_4Uxc' },
    ],
  },
  {
    id: 'acad-a-pallof',
    name: 'Pallof Press na Polia',
    prescription: '3×10 cada lado (3s isometria)',
    setsCount: 3,
    surfPurpose:
      'Blindagem anti-rotação do core: transfere força das pernas para a prancha sem desperdiçar energia torcendo a cintura.',
    l4s1Shield:
      'Exercício padrão-ouro para fissura radial em L5-S1 e contato na raiz direita L5. Empurre o cabo à frente mantendo pelve e costelas imóveis, respirando pelo diafragma.',
    videos: [
      { label: 'Ver Pallof Press', url: 'https://www.youtube.com/watch?v=LuePuoHEt6s' },
    ],
  },
  {
    id: 'acad-a-extensora-flexora',
    name: 'Cadeira Extensora + Mesa Flexora',
    prescription: '3×12 cada (sem descolar quadril)',
    setsCount: 3,
    surfPurpose:
      'Isolamento seguro de quadríceps e posteriores de coxa para absorver chop e manter resistência muscular sem cansar as costas.',
    l4s1Shield:
      'Zero compressão axial nos discos L4-L5/L5-S1. Na mesa flexora, contraia abdômen e mantenha o quadril colado no estofado durante toda a subida.',
    videos: [
      { label: 'Ver Extensora', url: 'https://www.youtube.com/watch?v=tcdgal1epsI' },
      { label: 'Ver Mesa Flexora sem Dor Lombar', url: 'https://www.youtube.com/watch?v=VWRKAkhRir4' },
    ],
  },
];

export const ACADEMIA_B_EXERCISES: ExerciseItem[] = [
  {
    id: 'acad-b-serrote',
    name: 'Remada Unilateral Serrote (apoiado no banco)',
    prescription: '3×12 cada lado',
    setsCount: 3,
    surfPurpose:
      'Potência e resistência de remada para entrar cedo nas ondas de Sultans e Pasta Point sem travar ombros.',
    l4s1Shield:
      'Apoio firme de mão e joelho no banco retira a sobrecarga de L5-S1. Puxe o cotovelo na direção do quadril com coluna perfeitamente neutra.',
    videos: [
      { label: 'Ver Remada Serrote', url: 'https://www.youtube.com/watch?v=mjFIZX68F_8' },
    ],
  },
  {
    id: 'acad-b-puxada',
    name: 'Puxada Alta na Polia (controlada)',
    prescription: '3×12',
    setsCount: 3,
    surfPurpose:
      'Fortalece grande dorsal e estabilizadores escapulares responsáveis pelo deslize eficiente da remada.',
    l4s1Shield:
      'Trave levemente o abdômen e NÃO jogue o tronco para trás arqueando a lombar (protege a retrolistese de L5). Puxe a barra até a clavícula com controle.',
    videos: [
      { label: 'Ver Puxada Alta na Polia', url: 'https://www.youtube.com/watch?v=3qj46qsOgfI' },
    ],
  },
  {
    id: 'acad-b-flexao',
    name: 'Flexão Inclinada Escapular',
    prescription: '3×10–12',
    setsCount: 3,
    surfPurpose:
      'Simula o empurrão do pop-up com ativação de serrátil anterior e estabilidade de ombro.',
    l4s1Shield:
      'A inclinação (mãos no banco ou barra fixa) impede a lombar de "ceder" em hiperextensão. Mantenha glúteos contraídos em prancha rígida.',
    videos: [
      { label: 'Ver Flexão Inclinada', url: 'https://www.youtube.com/watch?v=TfzlcE4293c' },
    ],
  },
  {
    id: 'acad-b-woodchopper',
    name: 'Woodchopper / Rotação na Polia',
    prescription: '3×10 cada lado',
    setsCount: 3,
    surfPurpose:
      'Desenvolve potência rotacional funcional para guiar o cutback e a rasgada conectando tronco, quadril e pés.',
    l4s1Shield:
      'OBRIGATÓRIO pivotar o pé de trás junto com o giro do quadril. A rotação nasce na coluna torácica e quadril — nunca torça a lombar com os pés presos no chão.',
    videos: [
      { label: 'Ver Woodchopper na Polia', url: 'https://www.youtube.com/watch?v=90Qh5XG6mqs' },
    ],
  },
];

export const AREIA_EXERCISES: ExerciseItem[] = [
  {
    id: 'areia-caminhada-hang',
    name: 'Caminhada Plana + Dead Hang Assistido na Barra',
    prescription: '15 min plano + 3×15–20s barra (ponta dos pés no chão)',
    setsCount: 3,
    surfPurpose:
      'Aquece circulação, lubrifica quadris e cria tração suave para abrir espaço entre vértebras após horas sentado ou de escala.',
    l4s1Shield:
      'Mantenha a ponta dos pés tocando o chão na barra para dosar a tração sem espasmo reflexo em L5-S1. Caminhe apenas no calçadão ou areia batida 100% plana.',
    videos: [
      { label: 'Ver Dead Hang Descompressão', url: 'https://www.youtube.com/watch?v=VCeKKtGGxJY' },
    ],
  },
  {
    id: 'areia-tornozelo',
    name: 'Mobilidade de Tornozelo em Semi-Ajoelhado',
    prescription: '2×10 cada lado',
    setsCount: 2,
    surfPurpose:
      'Dorsiflexão livre permite abaixar o centro de gravidade na prancha sem dobrar a coluna para frente.',
    l4s1Shield:
      'Quanto melhor o tornozelo avança sobre a ponta do pé, menos compensação de flexão lombar acontece no Bottom Turn.',
    videos: [
      { label: 'Ver Execução', url: 'https://www.youtube.com/watch?v=sj4x3u3UmZk' },
    ],
  },
  {
    id: 'areia-toracica',
    name: 'Rotação Torácica em 4 Apoios',
    prescription: '2×8 cada lado',
    setsCount: 2,
    surfPurpose:
      'Libera o giro do peito e ombros necessário para olhar o lip na cavada e completar o cutback.',
    l4s1Shield:
      'Quadril sentado levemente para trás nos calcanhares trava a lombar em segurança e isola 100% do giro na coluna torácica.',
    videos: [
      { label: 'Ver Rotação Torácica', url: 'https://www.youtube.com/watch?v=PLDCRU55LSU' },
    ],
  },
  {
    id: 'areia-prancha-ponte',
    name: 'Prancha Lateral + Ponte de Glúteo',
    prescription: 'Prancha 2×20s/lado + Ponte 3×12',
    setsCount: 3,
    surfPurpose:
      'Estabilidade lateral do quadrado lombar e glúteo médio para segurar a prancha firme na borda.',
    l4s1Shield:
      'Dupla clássica de Stuart McGill para proteger fissuras discais. Na ponte, suba contraindo glúteos sem forçar arco lombar excessivo.',
    videos: [
      { label: 'Ver Prancha Lateral Adaptada', url: 'https://www.youtube.com/watch?v=8imTmxwFgRg' },
      { label: 'Ver Ponte de Glúteo Segura', url: 'https://www.youtube.com/watch?v=ZBPwWREa8Xw' },
    ],
  },
  {
    id: 'areia-afundo-gorila-popup',
    name: 'Afundo Estático Descalço + Posição do Gorila + Pop-up Slow',
    prescription: 'Afundo 3×10/lado · Gorila 3×10 · Pop-up 3×5 sem salto',
    setsCount: 3,
    surfPurpose:
      'Propriocepção dos dedos e calcanhares na areia para sentir a troca de borda e automatizar o pop-up limpo.',
    l4s1Shield:
      'Pop-up sempre em câmera lenta, sem salto seco e sem chicote lombar (protege o Modic Tipo 1 de impacto reativo).',
    videos: [
      { label: 'Ver Afundo Estático', url: 'https://www.youtube.com/watch?v=nUlG__NTuxQ' },
      { label: 'Ver Posição do Gorila / Troca de Borda', url: 'https://www.youtube.com/watch?v=_h7rHWH2f70' },
      { label: 'Ver Pop-up Lento', url: 'https://www.youtube.com/watch?v=KCLWvAcPcPk' },
    ],
  },
];

export const CHINESE_FLOW_STEPS: ChineseFlowStep[] = [
  {
    index: 1,
    id: 'cf-1',
    name: 'Lymphatic Hops',
    status: 'adaptado',
    statusLabel: 'ADAPTADO L4-S1',
    surfBridge:
      'Ativa circulação/linfa e acorda tornozelos para leitura de borda sem comprimir o Modic 1.',
    instruction:
      'Sem salto nem impacto: faça molejo elástico suave nos joelhos mantendo a ponta dos pés sempre em contato com o chão.',
    videoUrl: 'https://www.youtube.com/watch?v=BGtvlIakEyI',
    videoLabel: 'Ver Adaptação Segura',
  },
  {
    index: 2,
    id: 'cf-2',
    name: 'Body Waves',
    status: 'adaptado',
    statusLabel: 'ADAPTADO L4-S1',
    surfBridge:
      'Ensina compressão e extensão do pumping (acelerada na parede) sem dobrar a lombar.',
    instruction:
      'Execute como dobradiça de quadril (Hip Hinge) com coluna reta estilo Gorila e joelhos macios, sem arredondar a lombar.',
    videoUrl: 'https://www.youtube.com/watch?v=qzy9tDkswEA',
    videoLabel: 'Ver Hip Hinge Seguro',
  },
  {
    index: 3,
    id: 'cf-3',
    name: 'Arm Swings',
    status: 'liberado',
    statusLabel: 'LIBERADO',
    surfBridge:
      'Solta ombros e escápulas para uma remada mais longa, solta e econômica no outside.',
    instruction:
      'Balanço rítmico e solto dos braços frente-trás com abdômen firme para estabilizar o centro e evitar hiperextensão.',
  },
  {
    index: 4,
    id: 'cf-4',
    name: 'Trunk Twists',
    status: 'adaptado',
    statusLabel: 'ADAPTADO L4-S1',
    surfBridge:
      'Lubrifica a coluna torácica para girar o corpo em bloco nas curvas (cavada e cutback).',
    instruction:
      'Sempre pivote o calcanhar de trás a cada giro — nunca torça a lombar com os pés travados no chão.',
    videoUrl: 'https://www.youtube.com/watch?v=w3OrX5rDWh8',
    videoLabel: 'Ver Giro c/ Pivot',
  },
  {
    index: 5,
    id: 'cf-5',
    name: 'Forward Arm Circles',
    status: 'liberado',
    statusLabel: 'LIBERADO',
    surfBridge:
      'Lubrifica a articulação dos ombros no sentido exato da braçada da remada.',
    instruction:
      'Círculos amplos de braços para frente, ombros baixos longe das orelhas e costelas alinhadas sobre a pelve.',
  },
  {
    index: 6,
    id: 'cf-6',
    name: 'Squats 90°',
    status: 'liberado',
    statusLabel: 'LIBERADO',
    surfBridge:
      'Força e resistência de coxas para segurar a base baixa em ondas longas das Maldivas.',
    instruction:
      'Agachamento fluido até cerca de 90 graus, parando antes de qualquer retroversão pélvica (coluna neutra).',
  },
  {
    index: 7,
    id: 'cf-7',
    name: 'Backward Arm Circles',
    status: 'liberado',
    statusLabel: 'LIBERADO',
    surfBridge:
      'Abre o peito e ativa escápulas contra a postura fechada causada por horas de remada.',
    instruction:
      'Círculos amplos para trás com respiração nasal fluida, sem projetar a barriga nem arquear a lombar.',
  },
  {
    index: 8,
    id: 'cf-8',
    name: 'Dead Arms',
    status: 'adaptado',
    statusLabel: 'ADAPTADO L4-S1',
    surfBridge:
      'Solta tensão acumulada de ombros e pescoço pós-remada mantendo o eixo do tronco leve.',
    instruction:
      'Deixe os braços pesados acompanharem a rotação suave, sempre pivotando o calcanhar oposto a cada giro.',
    videoUrl: 'https://www.youtube.com/watch?v=w3OrX5rDWh8',
    videoLabel: 'Ver Giro c/ Pivot',
  },
  {
    index: 9,
    id: 'cf-9',
    name: 'Golf Swings',
    status: 'adaptado',
    statusLabel: 'ADAPTADO L4-S1',
    surfBridge:
      'Simula exatamente a abertura de peito e olhar subindo da cavada (Bottom Turn) em direção ao lip.',
    instruction:
      'Libere o pé de trás no giro e leve o olhar junto com as mãos, mantendo a coluna longa e sem torção travada.',
    videoUrl: 'https://www.youtube.com/watch?v=w3OrX5rDWh8',
    videoLabel: 'Ver Rotação Segura',
  },
  {
    index: 10,
    id: 'cf-10',
    name: 'Marches',
    status: 'liberado',
    statusLabel: 'LIBERADO',
    surfBridge:
      'Trabalha equilíbrio unipodal e glúteo médio para manter estabilidade firme em cima da prancha.',
    instruction:
      'Eleve um joelho por vez mantendo o tronco 100% ereto, sem curvar as costas para encontrar o joelho.',
  },
  {
    index: 11,
    id: 'cf-11',
    name: 'Tiptoe Arm Swings',
    status: 'adaptado',
    statusLabel: 'ADAPTADO L4-S1',
    surfBridge:
      'Fortalece tornozelos e amortecimento de aterrissagem nas seções da onda sem choque seco.',
    instruction:
      'Suba na ponta dos pés descomprimindo a coluna e desça freando o calcanhar bem devagar, sem mergulhar a lombar.',
    videoUrl: 'https://www.youtube.com/watch?v=l3c8CYnksNI',
    videoLabel: 'Ver Adaptação Segura',
  },
  {
    index: 12,
    id: 'cf-12',
    name: 'Arco e Flecha Torácico em Pé (ex-Windmills)',
    status: 'substituido',
    statusLabel: 'SUBSTITUÍDO (EX #12)',
    surfBridge:
      'Gera rotação torácica limpa para cavada, rasgada e cutback sem torcer L5-S1.',
    instruction:
      'Windmills PROIBIDO! Em base de surf com coluna reta, estenda o braço da frente e puxe o cotovelo de trás abrindo o peito, acompanhando com o olhar.',
    videoUrl: 'https://www.youtube.com/watch?v=GFFcVqgCtD0',
    videoLabel: 'Ver Arco e Flecha Torácico',
  },
  {
    index: 13,
    id: 'cf-13',
    name: 'Ballet Squats',
    status: 'liberado',
    statusLabel: 'LIBERADO',
    surfBridge:
      'Abre mobilidade de quadril e virilha com tronco vertical para agachar compacto na cavada e no tubo.',
    instruction:
      'Pés afastados com pontas levemente para fora; desça mantendo tronco vertical e coluna perfeitamente neutra.',
  },
  {
    index: 14,
    id: 'cf-14',
    name: 'Wide Arm Step Backs',
    status: 'adaptado',
    statusLabel: 'ADAPTADO L4-S1',
    surfBridge:
      'Alonga peitoral e psoas encurtados por escalas e remada sem sobrecarregar a lombar.',
    instruction:
      'Dê passo curto para trás travando costelas e contraindo o glúteo da perna de trás para evitar hiperextensão de L5.',
  },
  {
    index: 15,
    id: 'cf-15',
    name: 'Horse Stance',
    status: 'liberado',
    statusLabel: 'LIBERADO',
    surfBridge:
      'Resistência isométrica de coxas e glúteos com impacto zero para segurar paredes de 150 m nas Maldivas.',
    instruction:
      'Base larga isométrica com coluna neutra, joelhos apontando para fora e respiração controlada.',
  },
  {
    index: 16,
    id: 'cf-16',
    name: 'Body Taps',
    status: 'adaptado',
    statusLabel: 'ADAPTADO L4-S1',
    surfBridge:
      'Acorda propriocepção corporal e sistema parassimpático antes do dia ou da queda no mar.',
    instruction:
      'Tapinhas leves em pé no tronco e quadril; se descer às pernas, agache flexionando os joelhos com coluna reta sem esticar o nervo ciático.',
  },
];

export const CHINESE_FLOW_VIDEOS: (VideoLink & { note?: string })[] = [
  {
    label: '15 min Completo (Jules Horn)',
    note: 'Aplique as adaptações L4-S1 da lista acima',
    url: 'https://www.youtube.com/watch?v=VOo2KJCv9Ws',
  },
  {
    label: '8 min Express (Move with Erin)',
    note: 'Ideal pós-escala ou dias corridos',
    url: 'https://www.youtube.com/watch?v=MrY519t8mf4',
  },
  {
    label: '5 min Sem Narração (Move with Erin)',
    note: 'Ritmo limpo para manhãs rápidas',
    url: 'https://www.youtube.com/watch?v=LEa6YmW49BU',
  },
  {
    label: '10 min Qi Gong Terapêutico p/ Lombar',
    note: 'Recomendado nos dias Amarelo / Vermelho',
    url: 'https://www.youtube.com/watch?v=8ua8CIwgh4A',
  },
];

export const HOTEL_EXERCISES: ExerciseItem[] = [
  {
    id: 'hotel-warmup',
    name: 'Aquecimento Pré-Surf (Mobilidade Geral)',
    prescription: '5 min contínuos',
    setsCount: 1,
    surfPurpose:
      'Eleva temperatura articular de quadris, ombros e tornozelos mesmo dentro do quarto de hotel.',
    l4s1Shield: 'Pule qualquer toque no pé com pernas esticadas; mantenha joelhos macios.',
    videos: [
      { label: 'Ver Aquecimento Pré-Surf', url: 'https://www.youtube.com/watch?v=eEKN2xlUUZc' },
    ],
  },
  {
    id: 'hotel-9090',
    name: 'Quadril 90/90',
    prescription: '2×10 trocas cada lado',
    setsCount: 2,
    surfPurpose:
      'Rotação interna e externa de quadril: segredo para encolher o joelho de trás no cutback e agachar baixo na cavada.',
    l4s1Shield: 'Use as mãos apoiadas atrás para manter a coluna longa e sem compensar na lombar.',
    videos: [
      { label: 'Ver Quadril 90/90', url: 'https://www.youtube.com/watch?v=xJMpEiZ5q6c' },
    ],
  },
  {
    id: 'hotel-deadbug',
    name: 'Dead Bug (Lento)',
    prescription: '2×10 lentas',
    setsCount: 2,
    surfPurpose: 'Coordena movimento independente de braços e pernas mantendo o core blindado.',
    l4s1Shield:
      'Lombar suavemente apoiada no chão o tempo todo; se começar a arquear, reduza a amplitude da perna.',
    videos: [
      { label: 'Ver Dead Bug', url: 'https://www.youtube.com/watch?v=rasFXFLywxM' },
    ],
  },
  {
    id: 'hotel-birddog',
    name: 'Perdigueiro / Bird-Dog',
    prescription: '2×8 cada lado (3s isometria)',
    setsCount: 2,
    surfPurpose: 'Estabilidade cruzada (cadeia posterior) essencial para equilíbrio dinâmico em cima da prancha.',
    l4s1Shield:
      'Pense em "crescer" para longe em linha reta — NÃO suba a perna acima da altura do quadril (retrolistese L5).',
    videos: [
      { label: 'Ver Bird-Dog', url: 'https://www.youtube.com/watch?v=AYRMIKnbc8A' },
    ],
  },
  {
    id: 'hotel-pallof',
    name: 'Pallof Press com Superband',
    prescription: '2×10 cada lado',
    setsCount: 2,
    surfPurpose: 'Anti-rotação portátil com elástico preso na maçaneta da porta.',
    l4s1Shield: 'Sem rotação lombar; resista à tração lateral com respiração controlada.',
    videos: [
      { label: 'Ver Pallof com Elástico', url: 'https://www.youtube.com/watch?v=GC0NIcCGRvw' },
    ],
  },
  {
    id: 'hotel-combo',
    name: 'Afundo Estático + Remada Sentada c/ Elástico + Gorila/Borda',
    prescription: 'Afundo 2×10/lado · Remada 2×15 · Gorila 5 min',
    setsCount: 3,
    surfPurpose:
      'Fecha a sessão com pernas, puxada de remada e memória motora de troca de borda.',
    l4s1Shield:
      'Na remada sentada com elástico nos pés, mantenha joelhos levemente flexionados para não tensionar a raiz direita de L5.',
    videos: [
      { label: 'Ver Afundo Estático', url: 'https://www.youtube.com/watch?v=nUlG__NTuxQ' },
      { label: 'Ver Remada Sentada com Elástico', url: 'https://www.youtube.com/watch?v=ZQ8lub8ck7E' },
      { label: 'Ver Gorila / Borda', url: 'https://www.youtube.com/watch?v=_h7rHWH2f70' },
    ],
  },
];

export const SURFSKATE_DRILLS = [
  {
    id: 'ss-rail',
    name: 'Rail Game (Oitos sem chiar a roda)',
    prescription: '10 min · 3 blocos',
    setsCount: 3,
    surfPurpose: 'Ensina a inclinar o corpo todo na borda com fluidez e controle de peso, sem "jogar" a rabeta.',
    l4s1Shield: 'Mantenha joelhos flexionados amortecendo o piso e evite travar a lombar em rotação brusca.',
    videos: [
      { label: 'Rail Game — Vídeo 1', url: 'https://www.youtube.com/watch?v=vYjkRZTzvJU' },
      { label: 'Rail Game — Vídeo 2', url: 'https://www.youtube.com/watch?v=RWbp2KQUvfM' },
    ],
  },
  {
    id: 'ss-bottom',
    name: 'Bottom Turn Frontside & Backside',
    prescription: '10 min · 3 blocos',
    setsCount: 3,
    surfPurpose: 'Treina a compressão limpa na base e o olhar guiando a subida para o lip.',
    l4s1Shield: 'Comprima dobrando tornozelos e quadris (Posição do Gorila), nunca curvando a lombar.',
    videos: [
      { label: 'Bottom Turn 1', url: 'https://www.youtube.com/watch?v=sP5-sfCulLE' },
      { label: 'Bottom Turn 2', url: 'https://www.youtube.com/watch?v=Vtuo-qPCTWc' },
      { label: 'Power Surf', url: 'https://www.youtube.com/watch?v=gdEJZikFncg' },
    ],
  },
  {
    id: 'ss-triangle',
    name: 'Triangle of Speed (Pumping Largo)',
    prescription: '8 min · 2 blocos',
    setsCount: 2,
    surfPurpose: 'Gera velocidade real subindo e descendo a linha da parede com ritmo de pernas.',
    l4s1Shield: 'Movimento largo e cadenciado; proibido chacoalhar quadris de forma curta e travada.',
    videos: [
      { label: 'Triangle of Speed', url: 'https://www.youtube.com/watch?v=w6DVFKYeBfA' },
    ],
  },
  {
    id: 'ss-connection',
    name: 'Conexão Bottom + Top Turn',
    prescription: '10 min · 3 blocos',
    setsCount: 3,
    surfPurpose: 'Conecta compressão na cavada, olhar no alvo, troca de borda e retorno fluido.',
    l4s1Shield: 'Sem chicote lombar no topo; termine a curva com braços calmos e tronco compacto.',
    videos: [
      { label: 'Conexão Bottom + Top', url: 'https://www.youtube.com/watch?v=dfHdY6SliKI' },
    ],
  },
];

export const MANEUVER_SCHOOL: ManeuverCard[] = [
  {
    id: 'man-acelerada',
    number: '01',
    title: 'Acelerada (Pumping)',
    subtitle: 'Gerar velocidade real na parede sem "sambar" na prancha',
    mainVideoUrl: 'https://www.youtube.com/watch?v=KVkQOdz44ns',
    mainVideoLabel: 'Guia Canal OFF — Acelerada',
    extraVideos: [
      { label: 'Aprofundamento: Yago & Leandro Dora', url: 'https://www.youtube.com/watch?v=kYDs-RNJrGY' },
    ],
    watchFor: 'Pé da frente um passo curto à frente do centro, leveza ao subir a parede e pressão constante ao descer.',
    drylandDrill: 'No surfskate (Triangle of Speed), faça arcos largos subindo e descendo com mãos calmas na linha da cintura.',
    l4s1Shield: 'Acelere com tornozelos e quadris, nunca "quebrando" a lombar para baixo.',
  },
  {
    id: 'man-cavada',
    number: '02',
    title: 'Cavada (Bottom Turn)',
    subtitle: 'A mãe de todas as manobras nas paredes longas das Maldivas',
    mainVideoUrl: 'https://www.youtube.com/watch?v=Q9Z9KGknIqk',
    mainVideoLabel: 'Guia Canal OFF — Cavada',
    extraVideos: [
      { label: 'Backside: Yago & Leandro Dora', url: 'https://www.youtube.com/watch?v=EjZtVPBn35o' },
      { label: 'Power Surf Bottom Turn', url: 'https://www.youtube.com/watch?v=gdEJZikFncg' },
    ],
    watchFor: 'Paciência para chegar na base da onda, olhar fixo no ponto alto do lip e mão interna próxima à água.',
    drylandDrill: 'Com fita crepe no chão ou no surfskate, recue o pé traseiro até o deck antes de comprimir e abrir o peito.',
    l4s1Shield: 'Dobre os joelhos e mantenha a coluna reta (Gorila); olhar guida a torácica sem torcer L5-S1.',
  },
  {
    id: 'man-rasgada',
    number: '03',
    title: 'Rasgada (Carving)',
    subtitle: 'Arco contínuo de borda jogando água com estilo',
    mainVideoUrl: 'https://www.youtube.com/watch?v=N-KKNNHZQWg',
    mainVideoLabel: 'Guia Canal OFF — Rasgada',
    extraVideos: [
      { label: 'Frontside: AprimoreSurf', url: 'https://www.youtube.com/watch?v=Psmqixi-KxU' },
      { label: 'Rasgada Rápida', url: 'https://www.youtube.com/watch?v=rHk_SsojwbU' },
    ],
    watchFor: 'Inclinação total da borda (rail), joelho de trás apontando para dentro e braço traseiro acompanhando o arco.',
    drylandDrill: 'No surfskate, desenhe arcos longos em "C" sem deixar as rodas traseiras chiarem.',
    l4s1Shield: 'Gire o corpo como uma unidade a partir do quadril/olhar — evite giro seco apenas de tronco.',
  },
  {
    id: 'man-cutback',
    number: '04',
    title: 'Cutback (Chave das Maldivas)',
    subtitle: 'Voltar para a espuma e conectar seções longas em Sultans & Pasta Point',
    mainVideoUrl: 'https://www.youtube.com/watch?v=xLQ5KH3B9E8',
    mainVideoLabel: 'Guia Canal OFF — Cutback',
    extraVideos: [
      { label: 'AprimoreSurf — Cutback', url: 'https://www.youtube.com/watch?v=VDMmkqcapt0' },
      { label: 'POV + Surfskate Cutback', url: 'https://www.youtube.com/watch?v=PxFHl-4r3p0' },
    ],
    watchFor: 'Cabeça olhando o tempo inteiro para a espuma onde você quer rebater; paciência mantendo a borda enterrada até o fim.',
    drylandDrill: 'Treine oitos completos no surfskate mantendo o queixo apontado para o cone central até completar 180°.',
    l4s1Shield: 'A rotação torácica trabalhada no Pilates e no Arco e Flecha garante um cutback redondo sem dor na lombar.',
  },
  {
    id: 'man-batida',
    number: '05',
    title: 'Batida / Snap (Front & Back)',
    subtitle: 'Mudança rápida de direção na parte crítica da onda',
    mainVideoUrl: 'https://www.youtube.com/watch?v=ovgmKiNFF-w',
    mainVideoLabel: 'Guia Canal OFF — Batida',
    extraVideos: [
      { label: 'Frontside: Yago Dora', url: 'https://www.youtube.com/watch?v=Dow9fouarLo' },
      { label: 'Backside: Yago Dora', url: 'https://www.youtube.com/watch?v=w0OqAgaAUcs' },
    ],
    watchFor: 'Chegar leve no topo (descompressão), pé de trás cravado no kick do deck e absorção controlada na descida.',
    drylandDrill: 'Simule a compressão na base, extensão ao chegar no topo e amortecimento macio de joelhos sem salto.',
    l4s1Shield: 'Evite pousos duros na base (flat); absorva o retorno da espuma flexionando quadris e tornozelos (Modic 1).',
  },
  {
    id: 'man-floater-tubo',
    number: '06',
    title: 'Floater & Tubo (Bônus Recifes Maldivas)',
    subtitle: 'Passar seções rápidas e encaixar na parede limpa de reef breaks',
    mainVideoUrl: 'https://www.youtube.com/watch?v=mZEEPNKt0Mo',
    mainVideoLabel: 'Tubo — Guia Canal OFF',
    extraVideos: [
      { label: 'Tubo: Jesse Mendes', url: 'https://www.youtube.com/watch?v=-NneMAtBaLo' },
      { label: 'Floater: Ítalo Ferreira', url: 'https://www.youtube.com/watch?v=xfv4jOvJBkc' },
      { label: 'Floater: Sikana', url: 'https://www.youtube.com/watch?v=fyM6_EQGKKw' },
    ],
    watchFor: 'No tubo: base compacta sem encurvar as costas, freando com a mão na parede. No floater: deslizar suave sobre a espuma.',
    drylandDrill: 'Pratique 30s de Horse Stance / agachamento compacto equilibrado olhando fixo para a saída.',
    l4s1Shield: 'Em floaters, só desça junto com a espuma em rampa suave — evite quedas chapadas de grande altura (Modic 1).',
  },
];

export const CANAL_OFF_PLAYLIST_URL =
  'https://www.youtube.com/playlist?list=PL1SPG-ZucBHcEo0z3eGiRKmYwf0S2ffgb';

export const ELITE_LESSONS: EliteLesson[] = [
  {
    id: 'elite-yago',
    title: 'Aula 1 — Yago Dora & Rafael Maldonado',
    duration: '23 min · Canal OFF',
    coach: 'Base, mobilidade e controle corporal em casa',
    videos: [{ label: 'Assistir Aula Completa (23 min)', url: 'https://www.youtube.com/watch?v=ily1dA07_yU' }],
    focus: 'Estabilidade de quadril, força funcional de pernas e postura de surf sem equipamentos pesados.',
    adaptations: [
      'Adaptação 1 (Raiz D L5): No alongamento posterior deitado, mantenha a cabeça apoiada no chão — NÃO puxe o queixo ao peito para não tensionar a raiz nervosa direita de L5.',
      'Adaptação 2 (L5-S1): Na prancha lateral com abdução, execute de forma estática ou com joelho de baixo apoiado, SEM twist suspenso.',
      'Adaptação 3 (Anti-flexão): Troque a prancha tocando o pé oposto por prancha alta com toque no ombro ou Perdigueiro (Bird-Dog).',
    ],
  },
  {
    id: 'elite-tati',
    title: 'Aula 2 — Tati Weston-Webb & Marcelo Amaral',
    duration: '27 min · Mobilidade Articular · Canal OFF',
    coach: 'Mobilidade articular completa para surf',
    videos: [{ label: 'Assistir Aula Completa (27 min)', url: 'https://www.youtube.com/watch?v=fyIgCnpk5hY' }],
    focus: 'Soltura de quadris, tornozelos, ombros e coluna torácica com ritmo fluido e baixo impacto.',
    adaptations: [
      'Mantenha a amplitude dentro do conforto lombar e evite qualquer hiperextensão acentuada (retrolistese de L5).',
    ],
  },
  {
    id: 'elite-jjf',
    title: 'Aula 3 — John John Florence',
    duration: 'Pés, Tornozelos e Quadril · Zero Compressão Lombar',
    coach: 'Mobilidade específica de base e tornozelos',
    videos: [
      { label: 'Parte 1 — Pés & Tornozelos', url: 'https://www.youtube.com/watch?v=oCPF8rxxWdA' },
      { label: 'Parte 2 — Quadril & Base', url: 'https://www.youtube.com/watch?v=6VczlvpPUdY' },
    ],
    focus: 'Fortalecimento intrínseco dos pés, mobilidade de tornozelo e liberdade de quadril com zero carga na coluna.',
    adaptations: [
      '100% seguro para dias Amarelos e semanas pré-infiltração; excelente preparação para sentir a prancha descalço.',
    ],
  },
];

export const L4S1_MATRIX = {
  proibidos: [
    'Agachamento livre com barra nas costas ou Smith (alta compressão axial L5-S1)',
    'Leg Press 45° (retroversão pélvica esmaga a extrusão central de 13 mm)',
    'Abdominal Crunch / Sit-up tradicional (flexão repetida agrava fissura radial)',
    'Levantamento Terra / Stiff pesados (alto cisalhamento em L4-L5 e L5-S1)',
    'Windmills e Russian Twist (flexão + rotação simultânea na lombar)',
    'Saltos, Pliometria, Burpees e Aéreos no surf (choque seco irrita Modic Tipo 1)',
    'Hiperextensão extrema / Banco Romano (agrava retrolistese de L5)',
    'Caminhada longa em areia inclinada perto da água (assimetria agrava leve escoliose à direita)',
  ],
  cautela: [
    'Elevação Pélvica no Banco (subir só até alinhar tronco-coxa, sem arquear lombar)',
    'Puxada Alta na Polia (costelas travadas, zero inclinação exagerada para trás)',
    'Woodchopper / Trunk Twists (obrigatório pivotar o pé de trás junto)',
    'Agachamento sem carga (parar em ~90° antes do butt wink)',
    'Surfskate (proibido derrapar rabeta/power slide ou travar quadril)',
    'Janela Pós-Infiltração AMIL (sem dor ≠ disco cicatrizado; manter 100% do Escudo)',
  ],
  ouro: [
    'Agachamento Búlgaro com halteres + Afundo Estático descalço',
    'Pallof Press (Polia ou Superband) · Dead Bug · Perdigueiro (Bird-Dog)',
    'Prancha Lateral + Ponte de Glúteo (estabilidade lombo-pélvica)',
    'Quadril 90/90 · Mobilidade de Tornozelo · Rotação Torácica 4 apoios',
    'Remada Unilateral Serrote apoiada + Flexão Inclinada com controle escapular',
    'Cadeira Extensora + Mesa Flexora (quadril colado no estofado)',
    'Fluxo Chinês Blindado (16 adaptados) + Qi Gong Terapêutico + Respiração 4-4-6-2',
    'Caminhada no plano (calçadão/areia batida plana) + Dead Hang assistido',
  ],
};

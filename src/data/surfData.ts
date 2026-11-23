export interface PresetForecastSpot {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lon: number;
  tideUrl: string;
}

export const PRESET_FORECAST_SPOTS: PresetForecastSpot[] = [
  {
    id: 'cabo-branco',
    name: 'Cabo Branco / Intermares',
    subtitle: 'João Pessoa - PB',
    lat: -7.0439,
    lon: -34.8357,
    tideUrl: 'https://tabuademares.com/br/paraiba/joao-pessoa',
  },
  {
    id: 'maracaipe',
    name: 'Maracaípe',
    subtitle: 'Ipojuca - PE',
    lat: -8.5297,
    lon: -35.0067,
    tideUrl: 'https://tabuademares.com/br/pernambuco/porto-de-galinhas',
  },
  {
    id: 'pipa',
    name: 'Pipa',
    subtitle: 'Tibau do Sul - RN',
    lat: -6.2286,
    lon: -35.0468,
    tideUrl: 'https://tabuademares.com/br/rio-grande-do-norte/natal',
  },
  {
    id: 'sultans',
    name: 'Sultans',
    subtitle: 'North Malé — Maldivas',
    lat: 4.3168,
    lon: 73.5055,
    tideUrl: 'https://www.tide-forecast.com/locations/Male-Maldives/tides/latest',
  },
  {
    id: 'pasta-point',
    name: 'Pasta Point',
    subtitle: 'North Malé — Maldivas',
    lat: 4.3247,
    lon: 73.5245,
    tideUrl: 'https://www.tide-forecast.com/locations/Male-Maldives/tides/latest',
  },
];

export const SURF_THEORY_CARDS = [
  {
    id: 'mare-lua',
    title: 'Como Ler Tábua de Maré e Lua',
    summary: 'Entenda a variação de volume de água e o ritmo das marés vivas (Cheia/Nova) e mortas (Quarto).',
    bullets: [
      'A maré muda aproximadamente a cada 6 horas (enche 6h, vaza 6h).',
      'Lua Cheia e Lua Nova trazem maior amplitude (maré seca muito baixa e cheia muito alta) — atenção redobrada sobre recifes nas Maldivas.',
      'A transição "seca para enchendo" costuma gerar correntes de entrada que organizam a parede sem fechar rápido demais.',
    ],
  },
  {
    id: '4-numeros',
    title: 'Os 4 Números da Previsão',
    summary: 'Altura, Período, Direção do Swell e Vento: decida em 15 segundos se vale a gasolina.',
    bullets: [
      'Altura (m): tamanho da ondulação em alto-mar. Ondas de 0,8m a 1,8m com período alto já entregam paredes excelentes.',
      'Período (s): tempo entre uma crista e outra. Abaixo de 8s = mar mexido/curto; 10s a 13s = parede limpa; 14s+ = swell oceânico potente.',
      'Direção do Swell: indica de onde a energia vem (ex: SE ou S) e define qual pico vai encaixar melhor.',
      'Vento: terral (sopra da terra para o mar) segura a parede aberta; maral (do mar para a areia) bagunça e cansa a remada.',
    ],
  },
  {
    id: 'tipos-fundo',
    title: 'Tipos de Fundo: Beach, Point & Reef Break',
    summary: 'Por que João Pessoa/NE se comporta diferente de Sultans e Pasta Point nas Maldivas.',
    bullets: [
      'Beach Break (areia): bancos mudam com a maré e tempestades; picos espalhados (ex: Intermares, Maracaípe).',
      'Point Break (pedra/ponta): onda acompanha um contorno fixo, gerando paredes longas e previsíveis.',
      'Reef Break (coral — Maldivas): fundo fixo gera ondas mecânicas, canal bem definido para entrar sem cansar a lombar e seção previsível para cavadas e cutbacks.',
    ],
  },
  {
    id: 'checklist-areia',
    title: 'Checklist de 5 min na Areia (Antes de Entrar)',
    summary: 'Nunca corra para a água: 5 minutos observando economizam 40% da energia da lombar.',
    bullets: [
      '1. Localize o canal de entrada (onde as ondas NÃO quebram ou a espuma corre para fora).',
      '2. Conte o tempo entre séries (sets) para remar na janela calma.',
      '3. Marque 1 ponto fixo na areia (coqueiro, quiosque) para perceber se a correnteza está te arrastando.',
      '4. Observe onde os surfistas com mais facilidade estão posicionando o bico da prancha.',
      '5. Faça 2 minutos de soltura de quadril/torácica e 3 respirações profundas antes de remar.',
    ],
  },
];

export const SURF_THEORY_VIDEOS = [
  {
    category: 'Como ler previsão',
    label: 'Leitura de Previsão — Aula 1',
    url: 'https://www.youtube.com/watch?v=yiVfJ9pXBIU',
  },
  {
    category: 'Como ler previsão',
    label: 'Leitura de Previsão — Aula 2',
    url: 'https://www.youtube.com/watch?v=Jzjg7KTyIoY',
  },
  {
    category: 'Marés no surf',
    label: 'Entendendo Marés no Surf',
    url: 'https://www.youtube.com/watch?v=NjmR8Ybylu4',
  },
  {
    category: 'Entrada pelo canal & leitura de mar',
    label: 'Canal e Leitura de Mar — Aula 1',
    url: 'https://www.youtube.com/watch?v=zx78RdLBRUQ',
  },
  {
    category: 'Entrada pelo canal & leitura de mar',
    label: 'Canal e Leitura de Mar — Aula 2',
    url: 'https://www.youtube.com/watch?v=IxR7OFSoBTw',
  },
];

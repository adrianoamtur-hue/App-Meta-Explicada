import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudRain,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Sun,
  Thermometer,
  Trash2,
  Waves,
  Wind,
} from 'lucide-react';
import type { LiveForecastData, SurfSpot, TideState } from '../types';
import {
  PRESET_FORECAST_SPOTS,
  SURF_THEORY_CARDS,
  SURF_THEORY_VIDEOS,
} from '../data/surfData';
import {
  degToCompass,
  evaluateSurfGasoline,
  weatherCodeToLabel,
} from '../utils/logic';

interface SurfTabProps {
  mySpots: SurfSpot[];
  onAddSpot: (spot: SurfSpot) => void;
  onDeleteSpot: (id: string) => void;
}

const TIDE_OPTIONS: TideState[] = ['Seca', 'Enchendo', 'Cheia', 'Vazando'];

export const SurfTab: React.FC<SurfTabProps> = ({ mySpots, onAddSpot, onDeleteSpot }) => {
  const [selectedSpotId, setSelectedSpotId] = useState(PRESET_FORECAST_SPOTS[0].id);
  const [customCoords, setCustomCoords] = useState<{ name: string; lat: number; lon: number } | null>(
    null
  );
  const [tide, setTide] = useState<TideState>('Enchendo');
  const [forecast, setForecast] = useState<LiveForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theory accordion
  const [openTheoryId, setOpenTheoryId] = useState<string | null>(SURF_THEORY_CARDS[0].id);

  // New Spot Form
  const [showAddSpot, setShowAddSpot] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newBestTide, setNewBestTide] = useState('');
  const [newBestWind, setNewBestWind] = useState('');
  const [newBottom, setNewBottom] = useState<SurfSpot['bottomType']>('Beach Break');
  const [newNotes, setNewNotes] = useState('');

  const activePreset = useMemo(
    () => PRESET_FORECAST_SPOTS.find((s) => s.id === selectedSpotId) || PRESET_FORECAST_SPOTS[0],
    [selectedSpotId]
  );

  const fetchForecast = useCallback(async (lat: number, lon: number, spotName: string) => {
    setLoading(true);
    setError(null);
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature&timezone=auto`;

      const [wRes, mRes] = await Promise.all([fetch(weatherUrl), fetch(marineUrl)]);
      if (!wRes.ok) throw new Error('Falha ao consultar Open-Meteo Weather');
      const wData = await wRes.json();
      const mData = mRes.ok ? await mRes.json() : null;

      const hourIdx = Math.min(new Date().getHours(), (wData.hourly?.precipitation_probability?.length || 1) - 1);
      const precipProb = wData.hourly?.precipitation_probability?.[hourIdx] ?? 0;

      setForecast({
        spotName,
        lat,
        lon,
        weatherCode: wData.current?.weather_code ?? 0,
        precipProb,
        airTempC: wData.current?.temperature_2m ?? 28,
        seaTempC: mData?.current?.sea_surface_temperature ?? null,
        waveHeightM: mData?.current?.wave_height ?? null,
        swellPeriodS: mData?.current?.swell_wave_period ?? null,
        swellDirectionDeg: mData?.current?.swell_wave_direction ?? null,
        windSpeedKmh: wData.current?.wind_speed_10m ?? 12,
        windDirectionDeg: wData.current?.wind_direction_10m ?? 90,
        fetchedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    } catch {
      setError('Não foi possível carregar o forecast ao vivo agora. Verifique a conexão e toque em atualizar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (customCoords) {
      fetchForecast(customCoords.lat, customCoords.lon, customCoords.name);
    } else {
      fetchForecast(activePreset.lat, activePreset.lon, `${activePreset.name} (${activePreset.subtitle})`);
    }
  }, [activePreset, customCoords, fetchForecast]);

  const handleUseMyGps = () => {
    if (!navigator.geolocation) {
      setError('GPS não disponível neste navegador.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomCoords({
          name: `Meu GPS (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        setLoading(false);
        setError('Permissão de GPS recusada. Escolha um dos picos acima.');
      },
      { timeout: 8000 }
    );
  };

  const verdict = useMemo(() => {
    if (!forecast) return null;
    return evaluateSurfGasoline({
      waveHeightM: forecast.waveHeightM,
      swellPeriodS: forecast.swellPeriodS,
      windSpeedKmh: forecast.windSpeedKmh,
      tide,
    });
  }, [forecast, tide]);

  const handleSaveNewSpot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddSpot({
      id: `spot-${Date.now()}`,
      name: newName.trim(),
      region: newRegion.trim() || 'Brasil',
      bestTide: newBestTide.trim() || 'Meia maré enchendo',
      bestWind: newBestWind.trim() || 'Terral fraco',
      bottomType: newBottom,
      notes: newNotes.trim() || 'Sem anotações ainda.',
    });
    setNewName('');
    setNewRegion('');
    setNewBestTide('');
    setNewBestWind('');
    setNewNotes('');
    setShowAddSpot(false);
  };

  const weatherMeta = forecast ? weatherCodeToLabel(forecast.weatherCode) : null;
  const WeatherIcon =
    weatherMeta?.kind === 'rain' ? CloudRain : weatherMeta?.kind === 'cloud' ? Cloud : Sun;

  const verdictStyles = verdict
    ? {
        verde: 'bg-[#ECFDF5] border-[#00A896]/40 text-[#064E3B]',
        amarelo: 'bg-[#FFFBEB] border-[#D97706]/40 text-[#78350F]',
        vermelho: 'bg-[#FEF2F2] border-[#E63946]/40 text-[#7F1D24]',
      }[verdict.light]
    : '';

  return (
    <div className="space-y-5">
      {/* Spot Selector + GPS */}
      <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[#1363DF]">OPEN-METEO WEATHER + MARINE (AO VIVO)</p>
            <h2 className="font-display font-bold text-lg text-[#06283D]">
              Forecast de Ondas &amp; Clima
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseMyGps}
              className="min-h-[42px] px-3.5 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] text-xs font-bold text-[#06283D] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#1363DF]" />
              <span>Usar meu GPS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (customCoords) {
                  fetchForecast(customCoords.lat, customCoords.lon, customCoords.name);
                } else {
                  fetchForecast(activePreset.lat, activePreset.lon, `${activePreset.name} (${activePreset.subtitle})`);
                }
              }}
              aria-label="Atualizar previsão do mar"
              className="min-h-[42px] min-w-[42px] rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] flex items-center justify-center cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-[#06283D] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Preset Spot Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {PRESET_FORECAST_SPOTS.map((spot) => {
            const active = !customCoords && selectedSpotId === spot.id;
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => {
                  setCustomCoords(null);
                  setSelectedSpotId(spot.id);
                }}
                aria-pressed={active}
                className={`min-h-[42px] px-3.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#06283D] text-white border-[#06283D]'
                    : 'bg-[#F8F6F1] text-[#06283D] border-[#E5E0D5] hover:bg-[#EFECE4]'
                }`}
              >
                {spot.name}
              </button>
            );
          })}
        </div>

        {/* Live Data Cards */}
        {loading && !forecast && (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-[#4A6578]">
            <Loader2 className="w-5 h-5 animate-spin text-[#1363DF]" />
            <span>Consultando boias e modelo marítimo ao vivo...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-[#FFF5F5] border border-[#E63946]/30 p-3.5 text-xs text-[#7F1D24]">
            {error}
          </div>
        )}

        {forecast && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5B7689]">
              <span className="font-semibold text-[#06283D]">{forecast.spotName}</span>
              <span className="font-mono tabular-nums">Atualizado às {forecast.fetchedAt}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
                <p className="text-[11px] font-semibold text-[#5B7689] flex items-center gap-1">
                  <WeatherIcon className="w-3.5 h-3.5 text-[#1363DF]" /> Clima &amp; Chuva
                </p>
                <p className="mt-1 font-display font-bold text-sm text-[#06283D]">
                  {weatherMeta?.label}
                </p>
                <p className="font-mono text-xs text-[#4A6578] tabular-nums mt-0.5">
                  Chuva: {forecast.precipProb}%
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
                <p className="text-[11px] font-semibold text-[#5B7689] flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-[#00A896]" /> Ar &amp; Água
                </p>
                <p className="mt-1 font-mono font-bold text-lg text-[#06283D] tabular-nums">
                  {Math.round(forecast.airTempC)}°C
                </p>
                <p className="font-mono text-xs text-[#007A6D] tabular-nums">
                  Mar: {forecast.seaTempC !== null ? `${forecast.seaTempC.toFixed(1)}°C` : '--'}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
                <p className="text-[11px] font-semibold text-[#5B7689] flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-[#1363DF]" /> Onda / Swell
                </p>
                <p className="mt-1 font-mono font-bold text-lg text-[#1363DF] tabular-nums">
                  {forecast.waveHeightM !== null ? `${forecast.waveHeightM.toFixed(1)} m` : '--'}
                </p>
                <p className="font-mono text-xs text-[#4A6578] tabular-nums">
                  {forecast.swellPeriodS !== null ? `${Math.round(forecast.swellPeriodS)}s` : '--'} ·{' '}
                  {degToCompass(forecast.swellDirectionDeg)}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5">
                <p className="text-[11px] font-semibold text-[#5B7689] flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-[#06283D]" /> Vento
                </p>
                <p className="mt-1 font-mono font-bold text-lg text-[#06283D] tabular-nums">
                  {Math.round(forecast.windSpeedKmh)} km/h
                </p>
                <p className="font-mono text-xs text-[#4A6578] tabular-nums">
                  Dir: {degToCompass(forecast.windDirectionDeg)} ({Math.round(forecast.windDirectionDeg)}°)
                </p>
              </div>
            </div>

            {/* Tide Selector + "Vale a Gasolina?" Verdict */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
              <div className="lg:col-span-5 rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#06283D]">Momento da Maré</span>
                  <a
                    href={activePreset.tideUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#1363DF] inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Tábua de Marés</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIDE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTide(opt)}
                      aria-pressed={tide === opt}
                      className={`min-h-[40px] rounded-lg text-xs font-bold border cursor-pointer ${
                        tide === opt
                          ? 'bg-[#1363DF] text-white border-[#1363DF]'
                          : 'bg-white text-[#06283D] border-[#E5E0D5]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {verdict && (
                <div className={`lg:col-span-7 rounded-xl border p-4 ${verdictStyles}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wide">
                    Semáforo: Vale a Gasolina? ({verdict.light.toUpperCase()})
                  </p>
                  <p className="font-display font-bold text-base mt-0.5">{verdict.verdict}</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">{verdict.tip}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Caderno "Meus Picos" */}
      <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-bold text-base text-[#06283D] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#00A896]" aria-hidden="true" />
              <span>Caderno &ldquo;Meus Picos&rdquo;</span>
            </h3>
            <p className="text-xs text-[#4A6578]">
              Suas anotações pessoais de maré, vento e fundo salvas no aparelho.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddSpot((s) => !s)}
            className="min-h-[42px] px-3.5 rounded-xl bg-[#06283D] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pico</span>
          </button>
        </div>

        {showAddSpot && (
          <form
            onSubmit={handleSaveNewSpot}
            className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="spot-name" className="block text-xs font-semibold text-[#4A6578] mb-1">
                  Nome do Pico *
                </label>
                <input
                  id="spot-name"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Baía Formosa"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E5E0D5] text-sm"
                />
              </div>
              <div>
                <label htmlFor="spot-region" className="block text-xs font-semibold text-[#4A6578] mb-1">
                  Cidade / Região
                </label>
                <input
                  id="spot-region"
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="Ex: RN"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E5E0D5] text-sm"
                />
              </div>
              <div>
                <label htmlFor="spot-tide" className="block text-xs font-semibold text-[#4A6578] mb-1">
                  Melhor Maré
                </label>
                <input
                  id="spot-tide"
                  type="text"
                  value={newBestTide}
                  onChange={(e) => setNewBestTide(e.target.value)}
                  placeholder="Ex: Seca para enchendo"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E5E0D5] text-sm"
                />
              </div>
              <div>
                <label htmlFor="spot-wind" className="block text-xs font-semibold text-[#4A6578] mb-1">
                  Melhor Vento
                </label>
                <input
                  id="spot-wind"
                  type="text"
                  value={newBestWind}
                  onChange={(e) => setNewBestWind(e.target.value)}
                  placeholder="Ex: Terral SO"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E5E0D5] text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="spot-bottom" className="block text-xs font-semibold text-[#4A6578] mb-1">
                  Tipo de Fundo
                </label>
                <select
                  id="spot-bottom"
                  value={newBottom}
                  onChange={(e) => setNewBottom(e.target.value as SurfSpot['bottomType'])}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E5E0D5] text-sm"
                >
                  <option value="Beach Break">Beach Break</option>
                  <option value="Point Break">Point Break</option>
                  <option value="Reef Break">Reef Break</option>
                  <option value="Misto">Misto</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="spot-notes" className="block text-xs font-semibold text-[#4A6578] mb-1">
                  Notas Pessoais
                </label>
                <input
                  id="spot-notes"
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Canal de entrada, perigos, melhor prancha..."
                  className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#E5E0D5] text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddSpot(false)}
                className="min-h-[42px] px-4 rounded-xl bg-white border border-[#E5E0D5] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[42px] px-4 rounded-xl bg-[#00A896] text-white text-xs font-bold cursor-pointer"
              >
                Salvar Pico
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {mySpots.map((spot) => (
            <article
              key={spot.id}
              className="rounded-xl bg-[#F8F6F1] border border-[#E5E0D5] p-4 flex flex-col justify-between gap-2"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#06283D]">{spot.name}</h4>
                    <p className="text-[11px] text-[#5B7689]">
                      {spot.region} · {spot.bottomType}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSpot(spot.id)}
                    aria-label={`Remover pico ${spot.name}`}
                    className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-white text-[#7A90A0] hover:text-[#E63946] flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2.5 space-y-1 text-xs text-[#284559]">
                  <p>
                    <strong>Maré:</strong> {spot.bestTide}
                  </p>
                  <p>
                    <strong>Vento:</strong> {spot.bestWind}
                  </p>
                  <p className="pt-1 text-[#4A6578] leading-relaxed">{spot.notes}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Teoria Simplificada + Vídeos */}
      <section className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-4">
        <div>
          <h3 className="font-display font-bold text-base text-[#06283D]">
            Teoria Simplificada do Mar
          </h3>
          <p className="text-xs text-[#4A6578]">
            Toque em qualquer cartão para revisar antes de ir à praia.
          </p>
        </div>

        <div className="space-y-2.5">
          {SURF_THEORY_CARDS.map((card) => {
            const isOpen = openTheoryId === card.id;
            return (
              <div
                key={card.id}
                className="rounded-xl border border-[#E5E0D5] overflow-hidden bg-[#F8F6F1]"
              >
                <button
                  type="button"
                  onClick={() => setOpenTheoryId(isOpen ? null : card.id)}
                  aria-expanded={isOpen}
                  className="w-full min-h-[54px] px-4 py-3 text-left flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <p className="font-display font-bold text-sm text-[#06283D]">{card.title}</p>
                    <p className="text-xs text-[#5B7689] mt-0.5">{card.summary}</p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#06283D] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#06283D] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 bg-white border-t border-[#E5E0D5]">
                    <ul className="space-y-1.5 text-xs text-[#1E3A4C] leading-relaxed list-disc list-inside">
                      {card.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Theory YouTube Links */}
        <div className="pt-2 border-t border-[#E5E0D5]">
          <p className="text-xs font-bold text-[#06283D] mb-2.5">Aulas em Vídeo (YouTube)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {SURF_THEORY_VIDEOS.map((v) => (
              <a
                key={v.url}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-[#F8F6F1] hover:bg-[#EFECE4] border border-[#E5E0D5] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#1363DF] truncate">{v.category}</p>
                  <p className="text-xs font-bold text-[#06283D] truncate">{v.label}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#1363DF] shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

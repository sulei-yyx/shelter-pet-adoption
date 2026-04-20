import { ExternalLink, List, LocateFixed, MapPin, Navigation, Search, Siren, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { api } from '../lib/api';
import { petSpeciesLabel } from '../lib/pet-helpers';
import { useAsyncData } from '../lib/useAsyncData';
import { cn } from '../lib/utils';
import type { Pet, PetSpecies } from '../types';

type SortMode = 'distance' | 'name';
type Coordinates = { lat: number; lng: number };
type AreaInfo = { city: string; district: string; road: string };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseDistance(distance: string) {
  const numeric = Number.parseFloat(distance.replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function describeArea(coordinates: Coordinates): AreaInfo {
  const district =
    coordinates.lng < 121.44
      ? '长宁区'
      : coordinates.lng < 121.468
        ? '静安区'
        : coordinates.lng < 121.49
          ? '黄浦区'
          : '浦东新区';

  const road =
    coordinates.lat > 31.24
      ? '延安西路'
      : coordinates.lat > 31.225
        ? '南京西路'
        : coordinates.lat > 31.21
          ? '淮海中路'
          : '陆家浜路';

  return { city: '上海', district, road };
}

export function MapMode() {
  const { data: pets, loading, error } = useAsyncData(() => api.listPets(), []);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const hasAutoSelectedRef = useRef(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState<'all' | PetSpecies>('all');
  const [sortMode, setSortMode] = useState<SortMode>('distance');
  const [query, setQuery] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setIsLocating(false);
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationDenied(false);
        setIsLocating(false);
      },
      () => {
        setLocationDenied(true);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  const visiblePets = useMemo(() => {
    if (!pets) return [];

    const normalizedQuery = query.trim().toLowerCase();
    const filtered = pets.filter((pet) => {
      if (speciesFilter !== 'all' && pet.species !== speciesFilter) return false;
      if (urgentOnly && !pet.urgent) return false;
      if (!normalizedQuery) return true;

      return [pet.name, pet.location, pet.breed, ...pet.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    const next = [...filtered];
    next.sort((left, right) => {
      if (sortMode === 'name') return left.name.localeCompare(right.name, 'zh-CN');
      if (userLocation) return getDistanceKm(userLocation, left.coordinates) - getDistanceKm(userLocation, right.coordinates);
      return parseDistance(left.distance) - parseDistance(right.distance);
    });
    return next;
  }, [pets, query, sortMode, speciesFilter, urgentOnly, userLocation]);

  useEffect(() => {
    if (selectedPetId && !visiblePets.some((pet) => pet.id === selectedPetId)) {
      setSelectedPetId(visiblePets[0]?.id ?? null);
    }
  }, [selectedPetId, visiblePets]);

  useEffect(() => {
    if (!hasAutoSelectedRef.current && selectedPetId === null && visiblePets.length > 0) {
      hasAutoSelectedRef.current = true;
      setSelectedPetId(visiblePets[0].id);
    }
  }, [selectedPetId, visiblePets]);

  const selectedPet = useMemo(
    () => visiblePets.find((pet) => pet.id === selectedPetId) ?? null,
    [selectedPetId, visiblePets]
  );

  const nearestPetSummary = useMemo(() => {
    if (!userLocation || visiblePets.length === 0) return null;

    let nearestPet = visiblePets[0];
    let nearestDistance = getDistanceKm(userLocation, nearestPet.coordinates);

    for (const pet of visiblePets.slice(1)) {
      const distance = getDistanceKm(userLocation, pet.coordinates);
      if (distance < nearestDistance) {
        nearestPet = pet;
        nearestDistance = distance;
      }
    }

    return {
      pet: nearestPet,
      distanceKm: nearestDistance,
      userArea: describeArea(userLocation),
      petArea: describeArea(nearestPet.coordinates),
    };
  }, [userLocation, visiblePets]);

  const petBounds = useMemo(() => {
    const fallback = { minLng: 121.38, maxLng: 121.52, minLat: 31.18, maxLat: 31.27 };
    if (visiblePets.length === 0) return fallback;

    const lngValues = visiblePets.map((pet) => pet.coordinates.lng);
    const latValues = visiblePets.map((pet) => pet.coordinates.lat);
    return {
      minLng: Math.min(...lngValues) - 0.02,
      maxLng: Math.max(...lngValues) + 0.02,
      minLat: Math.min(...latValues) - 0.02,
      maxLat: Math.max(...latValues) + 0.02,
    };
  }, [visiblePets]);

  function rawProjectPercent(coordinates: Coordinates) {
    return {
      x: ((coordinates.lng - petBounds.minLng) / (petBounds.maxLng - petBounds.minLng)) * 100,
      y: (1 - (coordinates.lat - petBounds.minLat) / (petBounds.maxLat - petBounds.minLat)) * 100,
    };
  }

  function projectPercent(coordinates: Coordinates) {
    const point = rawProjectPercent(coordinates);
    return {
      x: clamp(point.x, 8, 92),
      y: clamp(point.y, 10, 90),
    };
  }

  const mapLabels = useMemo(() => {
    const grouped = new Map<string, { count: number; xSum: number; ySum: number; district: string; road: string }>();

    visiblePets.forEach((pet) => {
      const area = describeArea(pet.coordinates);
      const point = projectPercent(pet.coordinates);
      const key = `${area.district}-${area.road}`;
      const current = grouped.get(key);

      if (current) {
        current.count += 1;
        current.xSum += point.x;
        current.ySum += point.y;
        return;
      }

      grouped.set(key, {
        count: 1,
        xSum: point.x,
        ySum: point.y,
        district: area.district,
        road: area.road,
      });
    });

    return Array.from(grouped.values()).map((item, index) => ({
      id: `${item.district}-${item.road}`,
      district: item.district,
      road: item.road,
      x: clamp(item.xSum / item.count + (index % 2 === 0 ? -4 : 4), 12, 88),
      y: clamp(item.ySum / item.count + (index % 2 === 0 ? -8 : 8), 12, 88),
    }));
  }, [visiblePets, petBounds]);

  const userMarker = useMemo(() => {
    if (!userLocation) return null;
    const raw = rawProjectPercent(userLocation);
    return {
      x: clamp(raw.x, 8, 92),
      y: clamp(raw.y, 10, 90),
      withinBounds: raw.x >= 0 && raw.x <= 100 && raw.y >= 0 && raw.y <= 100,
      area: describeArea(userLocation),
    };
  }, [petBounds, userLocation]);

  function clampOffset(nextOffset: { x: number; y: number }, nextZoom = zoom) {
    const viewport = mapViewportRef.current;
    if (!viewport) return nextOffset;
    if (nextZoom <= 1) return { x: 0, y: 0 };

    const maxOffsetX = ((nextZoom - 1) * viewport.clientWidth) / 2;
    const maxOffsetY = ((nextZoom - 1) * viewport.clientHeight) / 2;
    return {
      x: clamp(nextOffset.x, -maxOffsetX, maxOffsetX),
      y: clamp(nextOffset.y, -maxOffsetY, maxOffsetY),
    };
  }

  function centerOnCoordinates(target: Coordinates, nextZoom = zoom) {
    const viewport = mapViewportRef.current;
    if (!viewport) return;

    const point = projectPercent(target);
    const targetX = (point.x / 100) * viewport.clientWidth;
    const targetY = (point.y / 100) * viewport.clientHeight;
    setOffset(
      clampOffset(
        {
          x: viewport.clientWidth / 2 - targetX * nextZoom,
          y: viewport.clientHeight / 2 - targetY * nextZoom,
        },
        nextZoom
      )
    );
  }

  useEffect(() => {
    if (selectedPet) centerOnCoordinates(selectedPet.coordinates);
  }, [selectedPetId, petBounds.minLat, petBounds.maxLat, petBounds.minLng, petBounds.maxLng]);

  useEffect(() => {
    function handleResize() {
      setOffset((current) => clampOffset(current));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoom]);

  if (loading) return <LoadingState message="正在加载地图数据..." />;
  if (error || !pets) return <ErrorState message={error ?? '无法加载地图数据'} />;
  if (pets.length === 0) return <ErrorState message="当前没有可展示的宠物位置数据。" />;

  function getDisplayDistance(pet: Pet) {
    if (!userLocation) return pet.distance;
    return formatDistance(getDistanceKm(userLocation, pet.coordinates));
  }

  function openNavigation(lat: number, lng: number) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!isPanning) return;
    setOffset((current) =>
      clampOffset({
        x: current.x + event.movementX,
        y: current.y + event.movementY,
      })
    );
  }

  function resetView() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function renderPetMarker(pet: Pet) {
    const active = selectedPetId === pet.id;
    const point = projectPercent(pet.coordinates);

    return (
      <button
        key={pet.id}
        type="button"
        onClick={() => {
          setSelectedPetId(pet.id);
          centerOnCoordinates(pet.coordinates);
        }}
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
        className={cn('absolute -translate-x-1/2 -translate-y-1/2 z-10', active ? 'z-30' : 'z-20')}
      >
        <div className="relative">
          <div className={cn('absolute inset-0 rounded-full blur-md', active ? 'bg-primary/35 scale-150' : 'bg-black/10 scale-125')} />
          <div
            className={cn(
              'relative h-16 w-16 rounded-full border-4 bg-white p-1 shadow-2xl transition-all duration-300',
              active ? 'border-primary scale-110' : 'border-white hover:border-primary/60'
            )}
          >
            <img src={pet.mainImage} alt={pet.name} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow-lg">
            {pet.name}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 pt-28 pb-32">
      <div className="flex flex-col gap-4 px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight md:text-5xl">地图模式</h1>
          <p className="font-medium text-on-surface-variant">
            宠物点位优先保持清晰分布，你自己的位置会始终显示在地图内，超出范围时会贴边提示。
          </p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
          返回列表
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 px-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-3 rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索地点、宠物名、品种"
                className="w-full rounded-full border border-outline-variant/20 bg-surface-container-low py-3 pl-12 pr-4 font-medium outline-none transition focus:border-primary/40"
              />
            </label>

            <button
              type="button"
              onClick={() => setUrgentOnly((current) => !current)}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-bold transition',
                urgentOnly
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-outline-variant/20 bg-surface-container-low text-on-surface-variant'
              )}
            >
              <Siren className="h-4 w-4" />
              只看紧急领养
            </button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'all', label: '全部' },
                { id: 'dog', label: '狗狗' },
                { id: 'cat', label: '猫咪' },
                { id: 'other', label: '其他' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSpeciesFilter(item.id as 'all' | PetSpecies)}
                  className={cn(
                    'rounded-full border px-5 py-3 font-bold transition',
                    speciesFilter === item.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant/20 bg-surface-container-lowest text-on-surface hover:border-primary/30'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-full border border-outline-variant/20 bg-surface-container-lowest p-1">
                <button
                  type="button"
                  onClick={() => setSortMode('distance')}
                  className={cn('rounded-full px-4 py-2 font-semibold transition', sortMode === 'distance' ? 'bg-primary text-white' : 'text-on-surface-variant')}
                >
                  按距离
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('name')}
                  className={cn('rounded-full px-4 py-2 font-semibold transition', sortMode === 'name' ? 'bg-primary text-white' : 'text-on-surface-variant')}
                >
                  按名字
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!nearestPetSummary) return;
                  const nextZoom = 1.15;
                  setZoom(nextZoom);
                  centerOnCoordinates(nearestPetSummary.pet.coordinates, nextZoom);
                  setSelectedPetId(nearestPetSummary.pet.id);
                }}
                disabled={!nearestPetSummary}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-semibold text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LocateFixed className="h-4 w-4" />
                定位到最近宠物
              </button>

              <button
                type="button"
                onClick={resetView}
                className="rounded-full border border-outline-variant/20 bg-surface-container-low px-4 py-3 font-semibold text-on-surface"
              >
                重置视图
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">My Position</div>
            {userMarker ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-lg font-extrabold text-on-surface">
                  <LocateFixed className="h-4 w-4 text-secondary" />
                  <span>{userMarker.area.district}</span>
                </div>
                <div className="text-sm text-on-surface-variant">
                  {userMarker.area.city} · {userMarker.area.road}
                </div>
                <div className="text-sm text-on-surface-variant">
                  {userMarker.withinBounds ? '你的位置已显示在地图中。' : '你的位置超出当前宠物分布范围，已贴边显示。'}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-on-surface-variant">
                {isLocating ? '正在获取你的位置。' : locationDenied ? '未获得定位权限。' : '等待定位。'}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[1.5rem] bg-surface-container-low p-4">
            <div className="text-sm font-bold text-on-surface">{visiblePets.length} 个可见点位</div>
            <div className="mt-1 text-sm text-on-surface-variant">
              {userLocation ? '距离按你的实时位置动态计算。' : '未定位时使用默认距离。'}
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">Nearest Match</div>
            {nearestPetSummary ? (
              <div className="mt-3 space-y-2">
                <div className="text-lg font-extrabold text-on-surface">离你最近的是 {nearestPetSummary.pet.name}</div>
                <div className="text-sm text-on-surface-variant">距离 {formatDistance(nearestPetSummary.distanceKm)}</div>
                <div className="text-sm text-on-surface-variant">
                  最近宠物在 {nearestPetSummary.petArea.city}{nearestPetSummary.petArea.district} · {nearestPetSummary.petArea.road}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-on-surface-variant">开启定位后，这里会显示离你最近的宠物。</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative h-[calc(100vh-13rem)] min-h-[620px] max-h-[920px] overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-[#ddd7d0] shadow-xl">
          <div
            ref={mapViewportRef}
            onMouseDown={() => setIsPanning(true)}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
            className={cn('absolute inset-0 select-none overflow-hidden', isPanning ? 'cursor-grabbing' : 'cursor-grab')}
          >
            <motion.div
              animate={{ scale: zoom, x: offset.x, y: offset.y }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="absolute inset-0 origin-center"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.75),_transparent_28%),linear-gradient(135deg,_rgba(170,147,115,0.18),_rgba(91,124,120,0.14))]" />

              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-85" preserveAspectRatio="none">
                <defs>
                  <pattern id="street-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="0.22" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#street-grid)" />
                <path d="M2,28 C18,22 28,36 43,34 C60,32 74,18 98,22" fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="1" />
                <path d="M4,66 C24,60 35,74 50,70 C67,65 83,78 97,74" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.95" />
                <path d="M58,4 C62,18 60,34 55,47 C50,61 53,80 60,96" fill="none" stroke="rgba(112,168,220,0.74)" strokeWidth="3" />
              </svg>

              {mapLabels.map((label) => (
                <div
                  key={label.id}
                  style={{ left: `${label.x}%`, top: `${label.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/40 bg-white/55 px-4 py-2 text-center shadow-md backdrop-blur"
                >
                  <div className="text-[11px] font-black tracking-[0.28em] text-on-surface/55">{label.district}</div>
                  <div className="mt-1 text-xs font-semibold text-on-surface/70">{label.road}</div>
                </div>
              ))}

              {visiblePets.map(renderPetMarker)}

              {userMarker && (
                <div
                  style={{ left: `${userMarker.x}%`, top: `${userMarker.y}%` }}
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="relative">
                    <div className="absolute inset-0 scale-[2.2] animate-ping rounded-full bg-secondary/30" />
                    <div className={cn('relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-white shadow-xl', userMarker.withinBounds ? 'bg-secondary' : 'bg-amber-500')}>
                      <LocateFixed className="h-5 w-5" />
                    </div>
                    <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow">
                      {userMarker.withinBounds ? '我的位置' : '我的位置在范围外，已贴边显示'}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <div className="absolute left-6 top-6 rounded-[1.5rem] border border-outline-variant/20 bg-white/92 px-5 py-4 shadow-lg backdrop-blur">
              <div className="mb-1 text-xs uppercase tracking-[0.25em] text-on-surface-variant">Map Summary</div>
              <div className="text-2xl font-extrabold text-on-surface">{visiblePets.length} 个点位</div>
              <div className="mt-1 text-sm text-on-surface-variant">城市和道路标签会跟着宠物分布自动落到地图里。</div>
            </div>

            {userMarker && (
              <div className="absolute right-6 top-6 z-20 rounded-[1.5rem] border border-secondary/20 bg-white/94 px-4 py-4 shadow-lg backdrop-blur">
                <div className="text-xs uppercase tracking-[0.22em] text-on-surface-variant">My Position</div>
                <div className="mt-2 flex items-center gap-2 text-base font-extrabold text-on-surface">
                  <LocateFixed className="h-4 w-4 text-secondary" />
                  <span>{userMarker.area.district}</span>
                </div>
                <div className="mt-1 text-sm text-on-surface-variant">
                  {userMarker.area.city} · {userMarker.area.road}
                </div>
              </div>
            )}

            <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-3">
              <button
                type="button"
                onClick={() =>
                  setZoom((current) => {
                    const nextZoom = Math.min(current + 0.18, 2.2);
                    setOffset((currentOffset) => clampOffset(currentOffset, nextZoom));
                    return nextZoom;
                  })
                }
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-on-surface-variant shadow-xl"
              >
                <ZoomIn className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoom((current) => {
                    const nextZoom = Math.max(current - 0.18, 0.85);
                    setOffset((currentOffset) => clampOffset(currentOffset, nextZoom));
                    return nextZoom;
                  })
                }
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-on-surface-variant shadow-xl"
              >
                <ZoomOut className="h-6 w-6" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {selectedPet && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="absolute bottom-0 right-0 top-0 z-40 w-full overflow-y-auto border-l border-outline-variant/10 bg-white shadow-2xl md:w-[380px]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedPetId(null)}
                  className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="p-10 pt-24">
                  <div className="mb-8 aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl">
                    <img src={selectedPet.mainImage} alt={selectedPet.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    <h2 className="text-4xl font-extrabold tracking-tight">{selectedPet.name}</h2>
                    {selectedPet.urgent && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">紧急领养</span>}
                  </div>
                  <p className="text-lg font-medium text-on-surface-variant">
                    {selectedPet.breed} · {selectedPet.age}
                  </p>
                  <div className="my-6 flex items-center gap-2 font-bold text-on-surface-variant">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{selectedPet.location} · {getDisplayDistance(selectedPet)}</span>
                  </div>
                  <p className="mb-2 text-sm text-on-surface-variant">
                    所在片区：{describeArea(selectedPet.coordinates).city}{describeArea(selectedPet.coordinates).district} · {describeArea(selectedPet.coordinates).road}
                  </p>
                  <p className="mb-10 text-lg leading-relaxed text-on-surface-variant">{selectedPet.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <Link to={`/pet/${selectedPet.id}`} className="signature-gradient flex items-center justify-center gap-2 rounded-3xl py-5 font-bold text-white shadow-lg">
                      查看详情 <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => openNavigation(selectedPet.coordinates.lat, selectedPet.coordinates.lng)}
                      className="flex items-center justify-center gap-2 rounded-3xl bg-surface-container-low py-5 font-bold text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      去导航 <Navigation className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">位置列表</h2>
            </div>
            <div className="text-xs text-on-surface-variant">{sortMode === 'distance' ? '按距离排序' : '按名字排序'}</div>
          </div>

          <div className="space-y-4">
            {visiblePets.length === 0 && (
              <div className="rounded-[1.25rem] border border-dashed border-outline-variant/20 bg-surface-container-low p-5 text-sm leading-relaxed text-on-surface-variant">
                没有匹配结果，试试换个地点名、宠物名，或者关闭“只看紧急领养”。
              </div>
            )}

            {visiblePets.map((pet) => {
              const area = describeArea(pet.coordinates);
              return (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => {
                    setSelectedPetId(pet.id);
                    centerOnCoordinates(pet.coordinates);
                  }}
                  className={cn(
                    'w-full rounded-[1.25rem] border p-4 text-left transition',
                    selectedPetId === pet.id
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-transparent bg-surface-container-low hover:border-outline-variant/30'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <img src={pet.mainImage} alt={pet.name} className="h-14 w-14 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-bold">{pet.name}</div>
                        {pet.urgent && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">紧急</span>}
                      </div>
                      <div className="truncate text-sm text-on-surface-variant">{pet.location}</div>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {petSpeciesLabel(pet.species)} · {getDisplayDistance(pet)}
                      </div>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {area.city}{area.district} · {area.road}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

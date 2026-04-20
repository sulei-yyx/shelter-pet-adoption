import { Heart, MapPin, Search, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { petSpeciesLabel } from '../lib/pet-helpers';
import { useAsyncData } from '../lib/useAsyncData';

export function ExplorePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: pets, loading, error } = useAsyncData(() => api.listPets(), []);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useAsyncData(async () => {
    if (!user) {
      setFavoriteIds([]);
      return { favorites: [], pets: [] };
    }
    const payload = await api.getFavorites();
    setFavoriteIds(payload.favorites.map((item) => item.petId));
    return payload;
  }, [user?.id ?? 'guest']);

  const filteredPets = useMemo(() => {
    if (!pets) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pets;

    return pets.filter((pet) =>
      [pet.name, pet.breed, pet.location, petSpeciesLabel(pet.species)].some((field) =>
        field.toLowerCase().includes(normalized)
      )
    );
  }, [pets, query]);

  async function toggleFavorite(petId: string) {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const result = await api.toggleFavorite(petId);
    setFavoriteIds((current) =>
      result.favorited ? [...new Set([...current, petId])] : current.filter((id) => id !== petId)
    );
  }

  if (loading) return <LoadingState message="正在同步宠物列表..." />;
  if (error || !pets) return <ErrorState message={error ?? '无法加载宠物列表'} />;

  const heroPet = filteredPets[0];
  const highlightPets = filteredPets.slice(1, 3);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 pt-28 pb-24">
      <section className="flex flex-col gap-6">
        <div className="max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold leading-tight tracking-tight md:text-6xl"
          >
            找到适合你的下一位毛孩子
          </motion.h1>
        </div>

        <div className="group relative w-full max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-outline" />
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-full border border-outline-variant/20 bg-surface-container-lowest py-4 pl-12 pr-4 text-on-surface shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/40"
            placeholder="按宠物名、品种或位置搜索..."
          />
        </div>
      </section>

      {heroPet && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <Link to={`/pet/${heroPet.id}`} className="group relative min-h-[420px] overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-sm md:col-span-8">
            <img alt={heroPet.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={heroPet.mainImage} referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="glass absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 rounded-[2rem] border border-white/20 p-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  {heroPet.urgent && (
                    <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-on-secondary-container">
                      紧急领养
                    </span>
                  )}
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                    {petSpeciesLabel(heroPet.species)}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white md:text-4xl">{heroPet.name}</h2>
                <p className="mt-2 text-white/80">{heroPet.breed} - {heroPet.age}</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  void toggleFavorite(heroPet.id);
                }}
                className="signature-gradient rounded-full p-4 text-white shadow-lg"
              >
                <Heart className={favoriteIds.includes(heroPet.id) ? 'h-6 w-6 fill-current' : 'h-6 w-6'} />
              </button>
            </div>
          </Link>

          <div className="flex flex-col gap-6 md:col-span-4">
            {highlightPets.map((pet) => (
              <Link key={pet.id} to={`/pet/${pet.id}`} className="group relative min-h-[200px] flex-1 overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-sm">
                <img alt={pet.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={pet.mainImage} referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-2xl font-bold">{pet.name}</h3>
                  <p className="text-sm text-white/80">{pet.breed} - {pet.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">实时宠物列表</h2>
            <p className="mt-2 text-on-surface-variant">收藏、详情、申请和个人中心都连接到同一套后端数据。</p>
          </div>
          <Link to="/map" className="flex items-center gap-2 font-semibold text-primary hover:underline">
            <Sparkles className="h-4 w-4" /> 打开地图模式
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPets.map((pet) => (
            <motion.div key={pet.id} whileHover={{ y: -8 }} className="flex flex-col overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-sm">
              <Link to={`/pet/${pet.id}`} className="block h-72 overflow-hidden">
                <img alt={pet.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" src={pet.mainImage} referrerPolicy="no-referrer" />
              </Link>
              <div className="flex flex-col gap-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-on-surface">{pet.name}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{pet.breed}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleFavorite(pet.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-primary"
                  >
                    <Heart className={favoriteIds.includes(pet.id) ? 'h-5 w-5 fill-current' : 'h-5 w-5'} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <MapPin className="h-4 w-4" />
                  <span>{pet.location} - {pet.distance}</span>
                </div>
                <Link to={`/pet/${pet.id}`} className="mt-2 font-semibold text-primary hover:underline">
                  查看详情
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

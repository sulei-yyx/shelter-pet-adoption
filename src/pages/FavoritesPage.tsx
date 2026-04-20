import { Heart, PawPrint } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { api } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';

export function FavoritesPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getFavorites(), []);

  async function removeFavorite(petId: string) {
    await api.toggleFavorite(petId);
    await reload();
  }

  if (loading) return <LoadingState message="正在加载收藏列表..." />;
  if (error || !data) return <ErrorState message={error ?? '无法加载收藏列表'} />;

  const favorites = data.pets;

  return (
    <div className="pt-28 pb-32 max-w-7xl mx-auto px-6 text-on-surface">
      <header className="mb-12">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          我的收藏
        </motion.h1>
        <p className="text-lg text-on-surface-variant font-medium max-w-xl opacity-80">
          这里展示的是已登录账号在 Supabase 中保存的宠物收藏。
        </p>
      </header>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {favorites.map((pet) => (
            <motion.div key={pet.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-[2rem] overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all border border-outline-variant/10">
              <Link to={`/pet/${pet.id}`} className="relative h-72 overflow-hidden block">
                <img alt={pet.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" src={pet.mainImage} referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    void removeFavorite(pet.id);
                  }}
                  className="absolute top-4 right-4 z-10 w-10 h-10 glass rounded-full flex items-center justify-center text-primary shadow-lg"
                >
                  <Heart className="w-6 h-6 fill-current" />
                </button>
              </Link>

              <div className="p-8 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold">{pet.name}</h3>
                    <p className="text-sm text-on-surface-variant font-medium mt-1">{pet.breed}</p>
                  </div>
                  <span className="bg-surface-container-low text-on-surface font-black px-3 py-1 rounded-full text-xs shadow-inner">{pet.age}</span>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-3">{pet.description}</p>
                <Link to={`/pet/${pet.id}`} className="text-primary font-bold text-sm hover:underline">
                  查看详情
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-outline-variant" />
          </div>
          <h2 className="text-2xl font-bold mb-2">你还没有收藏任何宠物</h2>
          <p className="text-on-surface-variant mb-8">去看看有没有让你心动、想继续了解的小伙伴。</p>
          <Link to="/" className="signature-gradient text-white font-bold px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2">
            <PawPrint className="w-5 h-5" /> 去探索
          </Link>
        </div>
      )}
    </div>
  );
}

import { ArrowLeft, Heart, MapPin, Quote, Scale, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { petGenderLabel } from '../lib/pet-helpers';
import { useAsyncData } from '../lib/useAsyncData';

export function PetDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { id = '' } = useParams();
  const { data: pet, loading, error } = useAsyncData(() => api.getPet(id), [id]);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavorited(false);
      return;
    }
    void api.getFavorites().then((payload) => {
      setFavorited(payload.favorites.some((item) => item.petId === id));
    }).catch(() => {});
  }, [id, user]);

  async function handleFavorite() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    const result = await api.toggleFavorite(id);
    setFavorited(result.favorited);
  }

  if (loading) return <LoadingState message="正在加载宠物详情..." />;
  if (error || !pet) return <ErrorState message={error ?? '未找到对应宠物'} />;

  return (
    <div className="max-w-5xl mx-auto pt-0 md:pt-28 pb-32 md:pb-12">
      <div className="md:hidden fixed top-0 w-full z-50 glass py-4 px-4 flex justify-between items-center border-b border-surface-container-high">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => void handleFavorite()} className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface">
          <Heart className={favorited ? 'w-5 h-5 fill-current text-primary' : 'w-5 h-5'} />
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="md:col-span-2 relative h-[500px] rounded-[2rem] overflow-hidden bg-surface-container-low">
          <img alt={pet.name} className="w-full h-full object-cover" src={pet.mainImage} referrerPolicy="no-referrer" />
        </motion.div>
        <div className="hidden md:flex flex-col gap-6">
          {pet.gallery.slice(0, 2).map((img) => (
            <div key={img} className="h-1/2 rounded-[2rem] overflow-hidden bg-surface-container-low">
              <img alt={`${pet.name} 图集`} className="w-full h-full object-cover" src={img} referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div>
            <div className="flex items-center justify-between mb-2 gap-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">{pet.name}</h1>
              <button type="button" onClick={() => void handleFavorite()} className="hidden md:flex w-14 h-14 rounded-full bg-surface-container-low items-center justify-center text-primary">
                <Heart className={favorited ? 'w-6 h-6 fill-current' : 'w-6 h-6'} />
              </button>
            </div>
            <p className="text-xl text-on-surface-variant font-medium mb-6">{pet.breed} - {petGenderLabel(pet.gender)} - {pet.age}</p>
            <div className="flex flex-wrap gap-3">
              {pet.tags.map((tag) => (
                <span key={tag} className="px-5 py-2 rounded-full bg-surface-container-low text-on-surface-variant font-semibold text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-[2rem] p-10 relative overflow-hidden">
            <Quote className="absolute -top-4 -left-4 w-24 h-24 text-outline-variant/15" />
            <h2 className="text-2xl font-bold mb-6 relative z-10">认识一下 {pet.name}</h2>
            <p className="text-lg text-on-surface-variant leading-relaxed relative z-10">{pet.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-secondary w-6 h-6" />
                <h3 className="text-xl font-bold">健康信息</h3>
              </div>
              <ul className="space-y-4 font-medium text-on-surface-variant text-sm">
                <li className="flex justify-between border-b border-surface-container-low pb-3">
                  <span>疫苗记录</span> <span className="text-secondary font-bold">已登记</span>
                </li>
                <li className="flex justify-between border-b border-surface-container-low pb-3">
                  <span>绝育状态</span> <span className="text-secondary font-bold">请向救助站确认</span>
                </li>
                <li className="flex justify-between">
                  <span>所在机构</span> <span className="font-bold text-on-surface">{pet.location}</span>
                </li>
              </ul>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6">
                <Scale className="text-tertiary w-6 h-6" />
                <h3 className="text-xl font-bold">身体信息</h3>
              </div>
              <ul className="space-y-4 font-medium text-on-surface-variant text-sm">
                <li className="flex justify-between border-b border-surface-container-low pb-3">
                  <span>体型</span> <span className="font-bold text-on-surface">{pet.size}</span>
                </li>
                <li className="flex justify-between border-b border-surface-container-low pb-3">
                  <span>体重</span> <span className="font-bold text-on-surface">{pet.weight}</span>
                </li>
                <li className="flex justify-between">
                  <span>毛发长度</span> <span className="font-bold text-on-surface">{pet.coatLength}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="sticky top-32 bg-surface-container-lowest rounded-[2rem] p-8 shadow-xl border border-outline-variant/10 flex flex-col items-center text-center">
            <div className="w-full rounded-[2rem] bg-surface-container-low p-6 mb-8">
              <div className="flex items-center justify-center gap-2 text-on-surface-variant">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{pet.location} - {pet.distance}</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-2">准备申请领养 {pet.name} 吗？</h3>
            <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
              提交后，申请会通过 Express API 写入 Supabase，并出现在你的个人中心里。
            </p>

            <Link
              to={`/apply?petId=${pet.id}`}
              className="w-full signature-gradient text-on-primary font-bold text-lg py-5 rounded-full shadow-lg transition-transform flex justify-center items-center gap-3 mb-4"
            >
              开始填写申请
            </Link>

            <Link to="/map" className="w-full text-primary font-bold py-3 rounded-full hover:bg-primary/5 transition-colors">
              在地图中查看位置
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

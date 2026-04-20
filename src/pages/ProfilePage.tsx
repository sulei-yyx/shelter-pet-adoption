import { Bell, CheckCircle2, Heart, ImagePlus, Settings, Upload, User as UserIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/LoadingState';
import { api } from '../lib/api';
import { applicationStatusLabel } from '../lib/pet-helpers';
import { useAsyncData } from '../lib/useAsyncData';
import { cn } from '../lib/utils';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export function ProfilePage() {
  const profileQuery = useAsyncData(() => api.getProfile(), []);
  const applicationsQuery = useAsyncData(() => api.listApplications(), []);
  const favoritesQuery = useAsyncData(() => api.getFavorites(), []);
  const [toast, setToast] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (profileQuery.data?.avatar) {
      setAvatarPreview(profileQuery.data.avatar);
    }
  }, [profileQuery.data?.avatar]);

  if (profileQuery.loading || applicationsQuery.loading || favoritesQuery.loading) {
    return <LoadingState message="正在加载个人中心..." />;
  }

  if (profileQuery.error || applicationsQuery.error || favoritesQuery.error || !profileQuery.data || !applicationsQuery.data || !favoritesQuery.data) {
    return <ErrorState message={profileQuery.error ?? applicationsQuery.error ?? favoritesQuery.error ?? '无法加载个人中心'} />;
  }

  const profile = profileQuery.data;
  const applications = applicationsQuery.data;
  const favorites = favoritesQuery.data.pets;

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('请选择图片文件作为头像。');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError('头像图片请控制在 2MB 以内。');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result ?? ''));
      setAvatarError(null);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await api.updateProfile({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      avatar: avatarPreview || profile.avatar,
      bio: String(formData.get('bio') ?? ''),
      notifications: {
        email: formData.get('notify-email') === 'on',
        sms: formData.get('notify-sms') === 'on',
        push: formData.get('notify-push') === 'on',
      },
      preferences: {
        theme: String(formData.get('theme') ?? 'light') as 'light' | 'dark' | 'system',
        language: String(formData.get('language') ?? 'zh') as 'zh' | 'en' | 'jp',
      },
    });

    await profileQuery.reload();
    setToast('资料已保存，头像也同步更新了。');
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="relative min-h-screen pt-28 pb-32">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border border-outline/20 bg-on-surface px-6 py-4 font-bold text-surface shadow-2xl"
          >
            <CheckCircle2 className="h-5 w-5 text-secondary" />
            <span>{toast}</span>
            <button type="button" onClick={() => setToast(null)}>
              <X className="h-4 w-4 opacity-50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative mb-8 flex flex-col items-center py-16">
        <div className="absolute top-0 -z-10 h-64 w-full rounded-b-[4rem] bg-surface-container-low" />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 h-40 w-40 overflow-hidden rounded-full border-8 border-surface p-1 shadow-2xl">
          <img alt="用户头像" className="h-full w-full rounded-full object-cover" src={avatarPreview || profile.avatar} referrerPolicy="no-referrer" />
        </motion.div>
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight md:text-5xl">{profile.name}</h1>
        <p className="text-lg font-medium italic text-on-surface-variant opacity-80">{profile.bio}</p>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-12">
        <div className="flex flex-col gap-8 md:col-span-7">
          <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">我的申请</h2>
              <Link to="/" className="text-sm font-bold text-primary hover:underline">继续探索</Link>
            </div>

            <div className="flex flex-col gap-6">
              {applications.length === 0 && (
                <p className="text-on-surface-variant">你还没有提交申请，可以先去宠物详情页了解更多。</p>
              )}

              {applications.map((application) => (
                <Link key={application.id} to={`/pet/${application.petId}`} className="group block">
                  <div className="flex flex-col items-center gap-6 rounded-[1.5rem] border border-transparent bg-surface-container-low/30 p-6 sm:flex-row hover:border-outline-variant/30">
                    {application.pet && (
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1rem] shadow-md">
                        <img alt={application.pet.name} className="h-full w-full object-cover" src={application.pet.mainImage} referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="flex-grow text-center sm:text-left">
                      <div className="mb-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                        <h3 className="text-2xl font-bold leading-none">{application.pet?.name ?? '未知宠物'}</h3>
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-bold',
                            application.status === 'approved'
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-tertiary-container text-white'
                          )}
                        >
                          {applicationStatusLabel(application.status)}
                        </span>
                      </div>
                      <p className="mb-2 font-medium text-on-surface-variant">{application.pet?.breed ?? '宠物资料待同步'}</p>
                      <p className="text-sm text-on-surface-variant opacity-70">提交时间：{new Date(application.createdAt).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-sm">
            <h2 className="mb-8 text-2xl font-bold">账户设置</h2>
            <form className="space-y-8" onSubmit={saveProfile}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Field label="姓名" name="name" defaultValue={profile.name} icon={UserIcon} />
                <Field label="邮箱" name="email" defaultValue={profile.email} icon={Bell} />
              </div>

              <section className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-low p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface shadow">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="头像预览" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-outline" />
                      )}
                    </div>
                    <div>
                      <div className="text-lg font-bold">直接更换头像</div>
                      <p className="mt-1 text-sm text-on-surface-variant">选择本地图片后会立即预览，保存资料后同步到后端。</p>
                    </div>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/20 bg-white px-5 py-3 font-bold text-primary shadow-sm transition hover:border-primary/40">
                    <Upload className="h-4 w-4" />
                    选择头像图片
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>

                {avatarError && <p className="mt-4 text-sm font-medium text-red-600">{avatarError}</p>}
              </section>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">个人简介</label>
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={profile.bio}
                  className="w-full resize-none rounded-[1.5rem] border-none bg-surface-container-low p-4 font-medium transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <section className="space-y-4">
                  <h3 className="text-lg font-bold">通知设置</h3>
                  <Checkbox name="notify-email" label="邮件通知" defaultChecked={profile.notifications.email} />
                  <Checkbox name="notify-sms" label="短信通知" defaultChecked={profile.notifications.sms} />
                  <Checkbox name="notify-push" label="推送通知" defaultChecked={profile.notifications.push} />
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-bold">偏好设置</h3>
                  <div>
                    <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">主题</label>
                    <select name="theme" defaultValue={profile.preferences.theme} className="mt-2 w-full rounded-[1.5rem] bg-surface-container-low p-4">
                      <option value="light">浅色</option>
                      <option value="dark">深色</option>
                      <option value="system">跟随系统</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">语言</label>
                    <select name="language" defaultValue={profile.preferences.language} className="mt-2 w-full rounded-[1.5rem] bg-surface-container-low p-4">
                      <option value="zh">简体中文</option>
                      <option value="en">English</option>
                      <option value="jp">日本語</option>
                    </select>
                  </div>
                </section>
              </div>

              <button type="submit" className="signature-gradient rounded-full px-12 py-4 font-bold text-white shadow-lg transition-all hover:scale-[1.02]">
                保存修改
              </button>
            </form>
          </section>
        </div>

        <div className="flex flex-col gap-8 md:col-span-5">
          <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">我的收藏</h2>
              <Link to="/favorites" className="text-sm font-bold text-primary hover:underline">查看全部</Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {favorites.map((pet) => (
                <Link key={pet.id} to={`/pet/${pet.id}`} className="group relative block">
                  <div className="mb-3 aspect-square overflow-hidden rounded-[1.5rem] shadow">
                    <img alt={pet.name} className="h-full w-full object-cover" src={pet.mainImage} referrerPolicy="no-referrer" />
                  </div>
                  <h4 className="font-bold transition-colors group-hover:text-primary">{pet.name}</h4>
                  <p className="text-xs font-medium text-on-surface-variant">{pet.breed}</p>
                </Link>
              ))}
              {favorites.length === 0 && <p className="col-span-2 text-on-surface-variant">你还没有保存任何收藏。</p>}
            </div>
          </section>

          <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">数据连接说明</h2>
            </div>
            <p className="leading-relaxed text-on-surface-variant">
              这个页面聚合了 <code>/api/profile</code>、<code>/api/applications</code> 和 <code>/api/favorites</code> 三个真实接口的数据，
              现在头像也会直接随个人资料一起保存到后端。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  icon: Icon,
}: {
  label: string;
  name: string;
  defaultValue: string;
  icon: typeof UserIcon;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
        <input name={name} defaultValue={defaultValue} className="w-full rounded-[1.5rem] border-none bg-surface-container-low p-4 pl-12 font-medium transition-all focus:ring-2 focus:ring-primary/20" />
      </div>
    </div>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-[1.5rem] bg-surface-container-low p-4">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span className="font-medium">{label}</span>
    </label>
  );
}

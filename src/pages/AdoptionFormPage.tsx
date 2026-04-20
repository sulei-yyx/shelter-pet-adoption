import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';
import { cn } from '../lib/utils';

const housingOptions = [
  { id: 'apartment', label: '公寓' },
  { id: 'house', label: '独立住宅' },
  { id: 'townhouse', label: '联排住宅' },
];

export function AdoptionFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const petId = searchParams.get('petId') ?? '';
  const { data: pet } = useAsyncData(() => (petId ? api.getPet(petId) : Promise.resolve(null)), [petId]);

  const [housing, setHousing] = useState('house');
  const [fencedYard, setFencedYard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    petExperience: '',
  });

  const canSubmit = useMemo(() => {
    return Boolean(
      petId &&
      formState.firstName &&
      formState.lastName &&
      formState.email &&
      formState.phone &&
      formState.petExperience
    );
  }, [formState, petId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await api.createApplication({
        petId,
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        phone: formState.phone,
        housingType: housing,
        fencedYard,
        petExperience: formState.petExperience,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
      <header className="mb-16">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary hover:text-primary-container transition-all mb-10 font-bold group">
          <ArrowLeft className="mr-3 w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>返回</span>
        </button>
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-none">
          领养申请表
        </motion.h1>
        <p className="text-xl text-on-surface-variant font-medium leading-relaxed max-w-2xl opacity-80">
          {pet ? `你正在为 ${pet.name} 提交领养申请。` : '请从宠物详情页进入申请页，这样系统才能带上对应的宠物信息。'}
        </p>
      </header>

      <div className="bg-surface-container-lowest rounded-[2rem] p-10 md:p-16 shadow-2xl border border-outline-variant/10">
        {submitted ? (
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-secondary-container flex items-center justify-center">
              <Check className="w-10 h-10 text-secondary" />
            </div>
            <h2 className="text-3xl font-bold">申请已提交</h2>
            <p className="text-on-surface-variant">
              申请已经写入 Supabase，稍后可以在个人中心查看审核进度。
            </p>
            <button onClick={() => navigate('/profile')} className="signature-gradient text-white font-bold px-8 py-4 rounded-full">
              打开个人中心
            </button>
          </div>
        ) : (
          <form className="space-y-12" onSubmit={handleSubmit}>
            <section className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tight">联系方式</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField label="名字" value={formState.firstName} onChange={(value) => setFormState((current) => ({ ...current, firstName: value }))} placeholder="例如：小林" />
                <FormField label="姓氏" value={formState.lastName} onChange={(value) => setFormState((current) => ({ ...current, lastName: value }))} placeholder="例如：张" />
              </div>
              <FormField label="邮箱" value={formState.email} onChange={(value) => setFormState((current) => ({ ...current, email: value }))} placeholder="hello@example.com" type="email" />
              <FormField label="电话" value={formState.phone} onChange={(value) => setFormState((current) => ({ ...current, phone: value }))} placeholder="13800000000" type="tel" />
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tight">居住情况与经验</h2>
              <div className="space-y-4">
                <label className="block text-sm font-black text-on-surface-variant uppercase tracking-widest">住房类型</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {housingOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHousing(item.id)}
                      className={cn(
                        'relative flex cursor-pointer rounded-[1.5rem] p-6 transition-all border-2 flex-col items-center justify-center gap-3 text-center',
                        housing === item.id ? 'bg-primary/5 border-primary shadow-md scale-105' : 'bg-surface-container-low border-transparent hover:border-outline-variant/40'
                      )}
                    >
                      <span className="font-bold text-lg">{item.label}</span>
                      {housing === item.id && (
                        <div className="absolute top-3 right-3 bg-primary text-white p-1 rounded-full ring-4 ring-primary/10">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-black text-on-surface-variant uppercase tracking-widest">是否有围栏院子</label>
                <div className="flex gap-4">
                  {[true, false].map((option) => (
                    <button
                      key={String(option)}
                      type="button"
                      onClick={() => setFencedYard(option)}
                      className={cn(
                        'px-6 py-3 rounded-full border font-bold',
                        fencedYard === option ? 'bg-primary text-white border-primary' : 'bg-surface-container-low border-transparent'
                      )}
                    >
                      {option ? '有' : '没有'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-on-surface-variant uppercase tracking-widest">养宠经验</label>
                <textarea
                  className="w-full bg-surface-container-low border-2 border-transparent rounded-[1.5rem] px-6 py-4 focus:bg-surface-container-lowest focus:border-primary/30 transition-all resize-none font-medium"
                  placeholder="介绍一下你的作息、过往养宠经历，以及准备如何照顾这只宠物。"
                  rows={5}
                  value={formState.petExperience}
                  onChange={(event) => setFormState((current) => ({ ...current, petExperience: event.target.value }))}
                />
              </div>
            </section>

            <footer className="pt-6 flex justify-end">
              <button
                disabled={!canSubmit || submitting}
                className="w-full md:w-auto px-12 py-5 rounded-full signature-gradient text-white font-black shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3"
                type="submit"
              >
                {submitting ? '提交中...' : '提交申请'}
                <ChevronRight className="w-6 h-6" />
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-black text-on-surface-variant uppercase tracking-widest leading-none">{label}</label>
      <input
        className="w-full bg-surface-container-low border-2 border-transparent rounded-[1.5rem] px-6 py-4 focus:bg-surface-container-lowest focus:border-primary/30 transition-all font-bold placeholder:font-medium placeholder:opacity-30"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

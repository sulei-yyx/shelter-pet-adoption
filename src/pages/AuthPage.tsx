import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

function normalizeAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('email rate limit exceeded')) {
    return '当前邮箱发送过于频繁，Supabase 暂时限制了认证邮件发送。请稍后再试，或直接改用新的邮箱。';
  }
  if (lower.includes('already') || lower.includes('registered')) {
    return '这个邮箱已经注册过了，可以直接去登录。';
  }
  if (lower.includes('invalid login credentials')) {
    return '邮箱或密码不正确，请检查后重试。';
  }
  return message;
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const from = (location.state as { from?: string } | null)?.from ?? '/profile';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === 'register') {
        await api.registerUser({ email, password });
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setNotice('注册成功，已自动登录。');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(normalizeAuthError(err instanceof Error ? err.message : '认证失败'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center py-28 px-6">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-[2rem] shadow-xl border border-outline-variant/10 p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full signature-gradient text-white flex items-center justify-center">
            <PawPrint className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-on-surface-variant uppercase tracking-[0.2em]">
              Shelter Hub
            </p>
            <h1 className="text-3xl font-bold">
              {mode === 'login' ? '欢迎回来' : '创建账号'}
            </h1>
          </div>
        </div>

        <p className="text-on-surface-variant mb-8">
          {mode === 'login'
            ? '登录后可以保存收藏、提交领养申请，并管理你的个人资料。'
            : '现在注册不再依赖邮箱确认，QQ 邮箱和其他常见邮箱都可以直接注册并登录。'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-sm font-semibold mb-2">邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-surface-container-low p-4 rounded-[1.5rem] border border-transparent focus:border-primary/30 outline-none"
              placeholder="例如：123456@qq.com"
              required
            />
          </label>

          <label className="block">
            <span className="block text-sm font-semibold mb-2">密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-surface-container-low p-4 rounded-[1.5rem] border border-transparent focus:border-primary/30 outline-none"
              placeholder="至少 6 位"
              minLength={6}
              required
            />
          </label>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-[1.25rem] px-4 py-3 text-sm leading-relaxed">
              {error}
            </div>
          )}

          {notice && (
            <div className="bg-secondary-container/40 text-on-surface rounded-[1.25rem] px-4 py-3 text-sm leading-relaxed">
              {notice}
            </div>
          )}

          {mode === 'register' && (
            <div className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low rounded-[1.25rem] px-4 py-3">
              当前版本的注册流程由后端直接创建已确认账号，不再依赖确认邮件，因此也不会卡在 QQ 邮箱收不到邮件的问题上。
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full signature-gradient text-white font-bold py-4 rounded-full disabled:opacity-60"
          >
            {loading
              ? mode === 'login'
                ? '登录中...'
                : '注册中...'
              : mode === 'login'
                ? '登录'
                : '注册'}
          </button>
        </form>

        <div className="mt-5 text-center">
          {mode === 'login' && (
            <Link to="/forgot-password" className="text-sm text-primary font-semibold hover:underline">
              忘记密码？
            </Link>
          )}
        </div>

        <p className="text-sm text-on-surface-variant mt-6 text-center">
          {mode === 'login' ? '还没有账号？' : '已经有账号了？'}{' '}
          <Link to={mode === 'login' ? '/register' : '/login'} className="text-primary font-semibold hover:underline">
            {mode === 'login' ? '去注册' : '去登录'}
          </Link>
        </p>
      </div>
    </div>
  );
}

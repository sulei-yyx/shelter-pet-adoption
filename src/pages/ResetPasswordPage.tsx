import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage('密码已更新，正在跳转到登录页。');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置密码失败');
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
            <p className="text-sm text-on-surface-variant uppercase tracking-[0.2em]">Shelter Hub</p>
            <h1 className="text-3xl font-bold">重置密码</h1>
          </div>
        </div>

        {!ready ? (
          <div className="space-y-4">
            <p className="text-on-surface-variant">
              请从重置密码邮件里的链接打开此页面，这样系统才能识别你的重置会话。
            </p>
            <Link to="/forgot-password" className="text-primary font-semibold hover:underline">
              重新发送重置邮件
            </Link>
          </div>
        ) : (
          <>
            <p className="text-on-surface-variant mb-8">
              请输入新密码并确认，保存后即可使用新密码登录。
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="block text-sm font-semibold mb-2">新密码</span>
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

              <label className="block">
                <span className="block text-sm font-semibold mb-2">确认新密码</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-surface-container-low p-4 rounded-[1.5rem] border border-transparent focus:border-primary/30 outline-none"
                  placeholder="再次输入新密码"
                  minLength={6}
                  required
                />
              </label>

              {error && <div className="bg-red-50 text-red-700 rounded-[1.25rem] px-4 py-3 text-sm">{error}</div>}
              {message && <div className="bg-secondary-container/40 rounded-[1.25rem] px-4 py-3 text-sm">{message}</div>}

              <button type="submit" disabled={loading} className="w-full signature-gradient text-white font-bold py-4 rounded-full disabled:opacity-60">
                {loading ? '保存中...' : '保存新密码'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

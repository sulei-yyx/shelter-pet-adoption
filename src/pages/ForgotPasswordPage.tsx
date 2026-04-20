import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (resetError) throw resetError;
      setMessage('重置密码邮件已经发送，请前往邮箱继续操作。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送重置邮件失败');
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
            <h1 className="text-3xl font-bold">忘记密码</h1>
          </div>
        </div>

        <p className="text-on-surface-variant mb-8">
          输入注册邮箱，我们会发送一封重置密码邮件给你。
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block text-sm font-semibold mb-2">邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-surface-container-low p-4 rounded-[1.5rem] border border-transparent focus:border-primary/30 outline-none"
              placeholder="name@example.com"
              required
            />
          </label>

          {error && <div className="bg-red-50 text-red-700 rounded-[1.25rem] px-4 py-3 text-sm">{error}</div>}
          {message && <div className="bg-secondary-container/40 rounded-[1.25rem] px-4 py-3 text-sm">{message}</div>}

          <button type="submit" disabled={loading} className="w-full signature-gradient text-white font-bold py-4 rounded-full disabled:opacity-60">
            {loading ? '发送中...' : '发送重置邮件'}
          </button>
        </form>

        <p className="text-sm text-on-surface-variant mt-6 text-center">
          想起密码了？ <Link to="/login" className="text-primary font-semibold hover:underline">返回登录</Link>
        </p>
      </div>
    </div>
  );
}

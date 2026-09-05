import { FormEvent, useState } from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function ResetPasswordView() {
  const { setActiveTab, showToast } = useStore();
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword: confirmPassword })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        showToast('Password reset successfully');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'Unable to reset password.');
      }
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 bg-slate-50 min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset Password</h1>
          <p className="text-xs text-slate-500">Create a new password for your account.</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 text-xs font-bold p-3.5 rounded-xl border border-red-200 text-center">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-3.5 rounded-xl border border-emerald-200 text-center flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{message}</div>}
        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">New Password *</label>
              <input type="password" required minLength={8} placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Confirm Password *</label>
              <input type="password" required minLength={8} placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 text-slate-900 text-xs px-3.5 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:bg-white outline-none transition-all" />
            </div>
            <button type="submit" disabled={loading || !token} className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50">
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
        <button onClick={() => setActiveTab('profile')} className="w-full text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">Back to Sign In</button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', mode: 'single', inviteCode: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // If joining couple with code
      if (form.mode === 'couple' && form.inviteCode) {
        await api.post('/couple/join', { code: form.inviteCode });
        navigate('/dashboard/couple');
      } else if (form.mode === 'couple') {
        navigate('/invite');
      } else {
        navigate('/dashboard/single');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-4xl font-bold text-white">BudgetBuddy</h1>
          <p className="text-purple-300 mt-2">Let's get you set up</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6">Create account</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text" placeholder="Your name" required
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="email" placeholder="Email" required
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <input
              type="password" placeholder="Password" required
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-3">
              {['single', 'couple'].map(m => (
                <button
                  key={m} type="button"
                  onClick={() => setForm({...form, mode: m})}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    form.mode === m
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-white/10 text-purple-200 hover:bg-white/20'
                  }`}
                >
                  {m === 'single' ? '🧍 Solo' : '👫 Couple'}
                </button>
              ))}
            </div>

            {/* Invite code field — only for couple mode */}
            {form.mode === 'couple' && (
              <input
                type="text" placeholder="Have an invite code? Enter here (optional)"
                value={form.inviteCode}
                onChange={e => setForm({...form, inviteCode: e.target.value.toUpperCase()})}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 tracking-widest font-mono"
              />
            )}

            <button
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30"
            >
              Create account
            </button>
          </form>

          <p className="text-center text-purple-300 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
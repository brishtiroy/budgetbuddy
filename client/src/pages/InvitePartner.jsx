import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function InvitePartner() {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [sent, setSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  async function sendInvite() {
    if (!partnerEmail) return setError('Enter your partner\'s email');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/couple/invite', { partnerEmail });
      setGeneratedCode(res.data.code);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  }

  async function joinWithCode() {
    if (!inviteCode.trim()) return setError('Enter the invite code');
    setLoading(true);
    setError('');
    try {
      await api.post('/couple/join', { code: inviteCode.trim().toUpperCase() });
      const updatedUser = { ...user, mode: 'couple' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate('/dashboard/couple');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-900 to-purple-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">💌</div>
          <h1 className="text-3xl font-bold text-white mb-2">Invite sent!</h1>
          <p className="text-pink-300 mb-8">We emailed your partner. Share the code below too just in case.</p>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-8 mb-6">
            <p className="text-pink-300 text-sm mb-3">Your invite code</p>
            <div className="text-5xl font-mono font-bold text-white tracking-widest mb-4">
              {generatedCode}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(generatedCode)}
              className="text-sm text-pink-300 hover:text-white transition-colors"
            >
              📋 Copy code
            </button>
          </div>

          <p className="text-pink-300 text-sm mb-6">
            Ask your partner to sign up at <span className="text-white font-medium">localhost:5173/register</span> and enter this code.
          </p>

          <p className="text-white/50 text-xs">Waiting for your partner to join...</p>
          <button
            onClick={() => navigate('/dashboard/couple')}
            className="mt-4 text-pink-300 hover:text-white text-sm underline"
          >
            Continue to dashboard anyway →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-950 via-pink-900 to-purple-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👫</div>
          <h1 className="text-3xl font-bold text-white mb-2">Connect with your partner</h1>
          <p className="text-pink-300">Budget together, grow together</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-xl p-3 mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Send invite */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-4">
          <h2 className="text-white font-semibold mb-1">Invite your partner</h2>
          <p className="text-pink-300 text-sm mb-4">We'll email them a code to join your account</p>
          <input
            type="email"
            placeholder="Partner's email address"
            value={partnerEmail}
            onChange={e => setPartnerEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400 mb-3"
          />
          <button
            onClick={sendInvite}
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? 'Sending...' : 'Send invite 💌'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/20"/>
          <span className="text-pink-300 text-sm">or</span>
          <div className="flex-1 h-px bg-white/20"/>
        </div>

        {/* Join with code */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-1">Have an invite code?</h2>
          <p className="text-pink-300 text-sm mb-4">Enter the code your partner shared with you</p>
          <input
            type="text"
            placeholder="Enter code (e.g. A3F7B2)"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400 mb-3 font-mono tracking-widest text-center text-xl"
          />
          <button
            onClick={joinWithCode}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? 'Joining...' : 'Join couple account'}
          </button>
        </div>
      </div>
    </div>
  );
}
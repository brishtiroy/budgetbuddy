import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function ModeSelect() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  async function selectMode(mode) {
    await api.put('/budget/salary', { salary: 0, savingsPercent: 20 });
    const updated = { ...user, mode };
    localStorage.setItem('user', JSON.stringify(updated));

    if (mode === 'couple') navigate('/invite');
    else navigate('/dashboard/single');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="text-5xl mb-4">💰</div>
        <h1 className="text-4xl font-bold text-white mb-2">BudgetBuddy</h1>
        <p className="text-purple-300 mb-12">How would you like to budget?</p>

        <div className="grid grid-cols-2 gap-6">
          {/* Single card */}
          <button
            onClick={() => selectMode('single')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-purple-400 rounded-2xl p-8 text-left transition-all duration-200 hover:shadow-xl hover:shadow-purple-900/50 group"
          >
            <div className="text-5xl mb-4">🧍</div>
            <h2 className="text-xl font-bold text-white mb-2">Solo</h2>
            <p className="text-purple-300 text-sm leading-relaxed">
              Track your personal income, expenses, savings, and goals — all in one place.
            </p>
          </button>

          {/* Couple card */}
          <button
            onClick={() => selectMode('couple')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-pink-400 rounded-2xl p-8 text-left transition-all duration-200 hover:shadow-xl hover:shadow-pink-900/50 group"
          >
            <div className="text-5xl mb-4">👫</div>
            <h2 className="text-xl font-bold text-white mb-2">Couple</h2>
            <p className="text-pink-300 text-sm leading-relaxed">
              Budget together with your partner — joint expenses, shared goals, and personal savings.
            </p>
          </button>
        </div>

        <p className="text-purple-400 text-sm mt-8">You can change this later from your profile</p>
      </div>
    </div>
  );
}
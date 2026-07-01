import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Goals() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isCouple = user.mode === 'couple';

  const [personalGoals, setPersonalGoals] = useState([]);
  const [coupleGoals, setCoupleGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [goalType, setGoalType] = useState('personal');
  const [form, setForm] = useState({ name: '', targetAmount: '', targetDate: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  useEffect(() => { fetchGoals(); }, []);

  async function fetchGoals() {
    try {
      const res = await api.get('/goals');
      setPersonalGoals(res.data.personalGoals || []);
      setCoupleGoals(res.data.coupleGoals || []);
    } catch (err) {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }

  async function addGoal() {
    if (!form.name || !form.targetAmount || !form.targetDate) {
      return setError('Fill in all fields');
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/goals', {
        name: form.name,
        targetAmount: Number(form.targetAmount),
        targetDate: form.targetDate,
        type: goalType,
      });
      setForm({ name: '', targetAmount: '', targetDate: '' });
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add goal');
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(id) {
    await api.delete(`/goals/${id}`);
    fetchGoals();
  }

  function monthsLeft(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    return Math.max(
      (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()),
      0
    );
  }

  function progressPct(goal) {
    return Math.min(Math.round((goal.savedSoFar / goal.targetAmount) * 100), 100);
  }

  const GoalCard = ({ goal, type }) => {
    const months = monthsLeft(goal.targetDate);
    const pct = progressPct(goal);
    const isCouple = type === 'couple';

    return (
      <div className={`bg-white/5 border ${isCouple ? 'border-pink-500/20' : 'border-white/10'} rounded-2xl p-5`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {isCouple && <span className="text-xs bg-pink-600/20 text-pink-300 px-2 py-0.5 rounded-full">couple</span>}
              <h3 className="font-semibold text-white">{goal.name}</h3>
            </div>
            <p className="text-gray-500 text-xs">
              Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => deleteGoal(goal._id)}
            className="text-gray-600 hover:text-red-400 text-lg transition-colors">×</button>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{fmt(goal.savedSoFar)} saved</span>
            <span>{fmt(goal.targetAmount)} goal</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isCouple ? 'bg-pink-500' : 'bg-purple-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{pct}% complete</p>
        </div>

        {/* Monthly saving needed */}
        <div className={`rounded-xl p-3 ${isCouple ? 'bg-pink-500/10' : 'bg-purple-500/10'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400">Save per month</p>
              <p className={`text-xl font-bold ${isCouple ? 'text-pink-300' : 'text-purple-300'}`}>
                {fmt(goal.monthlySaving)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Months left</p>
              <p className="text-xl font-bold text-white">{months}</p>
            </div>
          </div>
          {months === 0 && (
            <p className="text-xs text-red-400 mt-2">⚠️ Target date has passed — update your goal</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(isCouple ? '/dashboard/couple' : '/dashboard/single')}
            className="text-gray-400 hover:text-white mr-2 transition-colors">←</button>
          <span className="text-xl">🎯</span>
          <span className="text-xl font-bold">Goals</span>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
        >
          + Add goal
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Add goal form */}
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="font-bold text-lg mb-4">New savings goal</h2>

            {error && (
              <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-xl p-3 mb-4 text-sm">{error}</div>
            )}

            {/* Personal or couple toggle */}
            {isCouple && (
              <div className="flex gap-2 mb-4">
                {['personal', 'couple'].map(t => (
                  <button key={t} onClick={() => setGoalType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      goalType === t
                        ? t === 'couple' ? 'bg-pink-600 text-white' : 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}>
                    {t === 'personal' ? '🧍 Personal' : '👫 Couple'}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="What are you saving for? (e.g. Dyson V15, Scooter)"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="How much does it cost?"
                  value={form.targetAmount}
                  onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
             <div>
              <label className="text-xs text-gray-500 block mb-1">Target date (when do you want to buy it?)</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={e => setForm({ ...form, targetDate: e.target.value })}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

              {/* Live preview */}
              {form.targetAmount && form.targetDate && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  {(() => {
                    const months = monthsLeft(form.targetDate);
                    const monthly = months > 0 ? Math.ceil(Number(form.targetAmount) / months) : 0;
                    return (
                      <div className="flex justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Monthly saving needed</p>
                          <p className="text-2xl font-bold text-purple-300">{fmt(monthly)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Months to go</p>
                          <p className="text-2xl font-bold text-white">{months}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setError(''); }}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-all">
                Cancel
              </button>
              <button onClick={addGoal} disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all">
                {saving ? 'Saving...' : 'Add goal'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading your goals...</div>
        ) : (
          <>
            {/* Personal goals */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                🧍 Personal goals
                {personalGoals.length > 0 && (
                  <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded-full">
                    {fmt(personalGoals.reduce((s, g) => s + (g.monthlySaving || 0), 0))}/mo total
                  </span>
                )}
              </h2>
              {personalGoals.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-gray-500 mb-2">No personal goals yet</p>
                  <p className="text-gray-600 text-sm">Planning to buy a Dyson, phone, or take a trip?</p>
                  <button onClick={() => { setGoalType('personal'); setShowForm(true); }}
                    className="mt-4 text-sm text-purple-400 hover:text-purple-300 underline">
                    Add your first goal →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {personalGoals.map(g => <GoalCard key={g._id} goal={g} type="personal" />)}
                </div>
              )}
            </div>

            {/* Couple goals — only shown in couple mode */}
            {isCouple && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  👫 Couple goals
                  {coupleGoals.length > 0 && (
                    <span className="text-xs bg-pink-600/20 text-pink-300 px-2 py-0.5 rounded-full">
                      {fmt(coupleGoals.reduce((s, g) => s + (g.monthlySaving || 0), 0))}/mo total
                    </span>
                  )}
                </h2>
                {coupleGoals.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-pink-500/20 rounded-2xl p-8 text-center">
                    <p className="text-gray-500 mb-2">No couple goals yet</p>
                    <p className="text-gray-600 text-sm">Planning a scooter, vacation, or home together?</p>
                    <button onClick={() => { setGoalType('couple'); setShowForm(true); }}
                      className="mt-4 text-sm text-pink-400 hover:text-pink-300 underline">
                      Add a couple goal →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coupleGoals.map(g => <GoalCard key={g._id} goal={g} type="couple" />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
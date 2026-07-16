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

  // New Phase 2 UI States
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [allocations, setAllocations] = useState({});
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [splitModal, setSplitModal] = useState(null); // { id, u1, u2 }

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

  // Feature 5: Toggle Pause/Resume status
  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'paused' ? 'in_progress' : 'paused';
    try {
      await api.put(`/goals/${id}/status`, { status: newStatus });
      fetchGoals();
    } catch (err) {
      alert('Failed to update goal status');
    }
  }

  // Feature 3: Update Custom Salary Split
  async function saveSplit() {
    if (!splitModal) return;
    try {
      await api.put(`/goals/${splitModal.id}/split`, {
        user1Percent: Number(splitModal.u1),
        user2Percent: Number(splitModal.u2)
      });
      setSplitModal(null);
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update split');
    }
  }

  // Features 5 & 7: Submit Parallel Monthly Contributions
  async function handleParallelContribute(e) {
    e.preventDefault();
    setSaving(true);
    const payload = Object.keys(allocations).map(goalId => ({
      goalId,
      amount: Number(allocations[goalId]) || 0
    })).filter(item => item.amount > 0);

    if (payload.length === 0) {
      setSaving(false);
      return alert('Please enter an amount for at least one goal');
    }

    try {
      await api.post('/goals/contribute', { allocations: payload });
      setAllocations({});
      setShowContributeModal(false);
      fetchGoals();
    } catch (err) {
      alert('Failed to log contributions');
    } finally {
      setSaving(false);
    }
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
    const isPaused = goal.status === 'paused';
    const isCompleted = goal.status === 'completed';

    return (
      <div className={`bg-white/5 border ${isCouple ? 'border-pink-500/20' : 'border-white/10'} rounded-2xl p-5 ${isPaused ? 'opacity-60' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {isCouple && <span className="text-xs bg-pink-600/20 text-pink-300 px-2 py-0.5 rounded-full">couple</span>}
              <h3 className="font-semibold text-white">{goal.name}</h3>
              {isPaused && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">Paused</span>}
              {isCompleted && <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">Completed 🎉</span>}
            </div>
            <p className="text-gray-500 text-xs">
              Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <button
                onClick={() => toggleStatus(goal._id, goal.status)}
                className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2.5 py-1 rounded-lg transition-colors"
                title={isPaused ? "Resume Goal" : "Pause Goal"}
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
            <button onClick={() => deleteGoal(goal._id)}
              className="text-gray-600 hover:text-red-400 text-lg transition-colors">×</button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{fmt(goal.savedSoFar)} saved</span>
            <span>{fmt(goal.targetAmount)} goal</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isCouple ? 'bg-pink-500' : 'bg-purple-500'} ${isCompleted ? 'bg-green-500' : ''}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
        </div>

        {/* Feature 3: Salary Split Display & Override for Couples */}
        {isCouple && goal.splitRatio && (
          <div className="flex justify-between items-center bg-white/5 px-3 py-1.5 rounded-lg mb-3 text-xs">
            <span className="text-gray-400">
              Contribution Split: <strong className="text-pink-300">{goal.splitRatio.user1Percent}% / {goal.splitRatio.user2Percent}%</strong>
              {goal.splitRatio.isCustom && <span className="text-[10px] text-gray-500 ml-1">(Custom)</span>}
            </span>
            <button
              onClick={() => setSplitModal({ id: goal._id, u1: goal.splitRatio.user1Percent, u2: goal.splitRatio.user2Percent })}
              className="text-pink-400 hover:underline"
            >
              Edit Split
            </button>
          </div>
        )}

        {/* Monthly saving needed */}
        <div className={`rounded-xl p-3 ${isCouple ? 'bg-pink-500/10' : 'bg-purple-500/10'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400">Save per month</p>
              <p className={`text-xl font-bold ${isCouple ? 'text-pink-300' : 'text-purple-300'}`}>
                {isPaused ? '₹0 (Paused)' : isCompleted ? 'Goal Reached!' : fmt(goal.monthlySaving)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Months left</p>
              <p className="text-xl font-bold text-white">{months}</p>
            </div>
          </div>
          {months === 0 && !isCompleted && !isPaused && (
            <p className="text-xs text-red-400 mt-2">⚠️ Target date has passed — update your goal</p>
          )}
        </div>

        {/* Feature 2: Individual Contribution History Toggle */}
        <div className="mt-3 border-t border-white/5 pt-2">
          <button
            onClick={() => setExpandedHistory(expandedHistory === goal._id ? null : goal._id)}
            className="text-xs text-gray-400 hover:text-white flex items-center justify-between w-full"
          >
            <span>📜 Contribution Ledger ({goal.contributions?.length || 0})</span>
            <span>{expandedHistory === goal._id ? '▲' : '▼'}</span>
          </button>

          {expandedHistory === goal._id && (
            <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto text-xs bg-black/20 p-2 rounded-lg">
              {goal.contributions && goal.contributions.length > 0 ? (
                goal.contributions.map((c, i) => (
                  <div key={i} className="flex justify-between text-gray-300 border-b border-white/5 pb-1 last:border-0">
                    <span>{c.userId?.name || 'User'}: <strong className="text-green-400">+{fmt(c.amount)}</strong></span>
                    <span className="text-gray-500">{new Date(c.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-1">No savings logged yet</p>
              )}
            </div>
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
        <div className="flex gap-2">
          {/* New Parallel Contribution Trigger */}
          <button
            onClick={() => { setShowContributeModal(true); setAllocations({}); }}
            className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-lg shadow-green-900/20"
          >
            💰 Log Monthly Savings
          </button>
          <button
            onClick={() => { setShowForm(true); setError(''); }}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            + Add goal
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Feature 5 & 7: Parallel Monthly Contribution Modal */}
        {showContributeModal && (
          <div className="bg-white/10 border border-green-500/30 rounded-2xl p-6 mb-8 backdrop-blur-md">
            <h2 className="font-bold text-lg mb-2 text-green-300">💰 Log Monthly Savings</h2>
            <p className="text-xs text-gray-400 mb-4">
              Allocate your savings across your active goals. Timelines will update automatically!
            </p>
            <form onSubmit={handleParallelContribute} className="space-y-3">
              {[...personalGoals, ...coupleGoals].filter(g => g.status === 'in_progress').map(goal => (
                <div key={goal._id} className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-medium">{goal.name}</p>
                    <p className="text-xs text-gray-500">Suggested: {fmt(goal.monthlySaving)}/mo</p>
                  </div>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={allocations[goal._id] || ''}
                      onChange={e => setAllocations({ ...allocations, [goal._id]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-sm text-right focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setShowContributeModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-xl text-sm transition-all">
                  {saving ? 'Saving...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feature 3: Custom Split Modal */}
        {splitModal && (
          <div className="bg-white/10 border border-pink-500/30 rounded-2xl p-6 mb-8 backdrop-blur-md">
            <h2 className="font-bold text-lg mb-2 text-pink-300">⚖️ Edit Contribution Split</h2>
            <p className="text-xs text-gray-400 mb-4">Set custom contribution percentages for this joint goal.</p>
            <div className="flex gap-4 items-center mb-4">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Partner 1 (%)</label>
                <input type="number" value={splitModal.u1} onChange={e => setSplitModal({ ...splitModal, u1: e.target.value, u2: 100 - Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-center" />
              </div>
              <span className="text-gray-500">+</span>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">Partner 2 (%)</label>
                <input type="number" value={splitModal.u2} onChange={e => setSplitModal({ ...splitModal, u2: e.target.value, u1: 100 - Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-center" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSplitModal(null)} className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-sm">Cancel</button>
              <button onClick={saveSplit} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-semibold py-2 rounded-xl text-sm">Save Split</button>
            </div>
          </div>
        )}

        {/* Add goal form */}
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="font-bold text-lg mb-4">New savings goal</h2>

            {error && (
              <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-xl p-3 mb-4 text-sm">{error}</div>
            )}

            {isCouple && (
              <div className="flex gap-2 mb-4">
                {['personal', 'couple'].map(t => (
                  <button key={t} onClick={() => setGoalType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${goalType === t
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
                          <p className="text-xl font-bold text-white">{months}</p>
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
                    {fmt(personalGoals.filter(g => g.status !== 'paused').reduce((s, g) => s + (g.monthlySaving || 0), 0))}/mo active
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

            {/* Couple goals */}
            {isCouple && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  👫 Couple goals
                  {coupleGoals.length > 0 && (
                    <span className="text-xs bg-pink-600/20 text-pink-300 px-2 py-0.5 rounded-full">
                      {fmt(coupleGoals.filter(g => g.status !== 'paused').reduce((s, g) => s + (g.monthlySaving || 0), 0))}/mo active
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
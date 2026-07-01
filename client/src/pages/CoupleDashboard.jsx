import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CoupleDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [partnerReady, setPartnerReady] = useState(false);

  // Step 1
  const [mySalary, setMySalary] = useState('');
  const [mySavingsPct, setMySavingsPct] = useState(20);

  // Step 2
  const [rent, setRent] = useState('');
  const [myCommute, setMyCommute] = useState('');
  const [otherFixed, setOtherFixed] = useState('');

  // Results
  const [breakdown, setBreakdown] = useState(null);

  const savingsOptions = [10, 15, 20, 25, 30, 40, 50];
  const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    loadSavedBudget();
  }, []);

  async function loadSavedBudget() {
    try {
      const detailsRes = await api.get('/couple/details');
      if (detailsRes.data.user2) setPartnerReady(true);

      const budgetRes = await api.get('/budget/couple-breakdown');
      if (budgetRes.data.budget?.breakdown) {
        setBreakdown(budgetRes.data.budget.breakdown);
        setRent(String(budgetRes.data.budget.rent || ''));
        setMyCommute(String(budgetRes.data.budget.myCommute || ''));
        setOtherFixed(String(budgetRes.data.budget.otherFixed || ''));
        setStep(3);
      }
    } catch {
      // fresh start, no saved budget yet
    }
  }

  async function saveStep1() {
    if (!mySalary) return setError('Enter your monthly salary');
    setError('');
    setLoading(true);
    try {
      await api.put('/budget/salary', {
        salary: Number(mySalary),
        savingsPercent: mySavingsPct
      });
      setStep(2);
    } catch {
      setError('Failed to save salary');
    } finally {
      setLoading(false);
    }
  }

  async function calculateBreakdown() {
    if (!rent) return setError('Enter your monthly rent');
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/budget/couple-breakdown', {
        rent: Number(rent),
        commute: Number(myCommute) || 0,
        otherFixed: Number(otherFixed) || 0,
      });
      setBreakdown(res.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not calculate — partner may not have joined yet');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">💑</span>
          <span className="text-xl font-bold">BudgetBuddy</span>
          <span className="ml-2 text-xs bg-pink-600/30 text-pink-300 border border-pink-600/40 px-2 py-0.5 rounded-full">
            Couple
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/goals')}
            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
          >
            Goals
          </button>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Partner not joined warning */}
        {!partnerReady && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-amber-300 font-medium text-sm">Partner hasn't joined yet</p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                Their salary won't be included until they join
              </p>
            </div>
            <button
              onClick={() => navigate('/invite')}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-2 rounded-lg transition-all"
            >
              Invite again →
            </button>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Salaries', 'Fixed costs', 'Your budget'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${
                step > i + 1 ? 'text-green-400' :
                step === i + 1 ? 'text-white' : 'text-gray-600'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border ${
                  step > i + 1
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : step === i + 1
                    ? 'bg-pink-600 border-pink-500 text-white'
                    : 'border-gray-700 text-gray-600'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="text-sm hidden sm:block">{label}</span>
              </div>
              {i < 2 && (
                <div className={`h-px w-8 ${step > i + 1 ? 'bg-green-500/50' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-xl p-3 mb-5 text-sm">
            {error}
          </div>
        )}

        {/* ── STEP 1: Salary ── */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-1">Your income</h2>
            <p className="text-gray-400 text-sm mb-6">
              Your partner will add theirs when they join
            </p>

            <label className="text-sm text-gray-400 block mb-1">Your monthly salary</label>
            <div className="relative mb-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                placeholder="e.g. 75000"
                value={mySalary}
                onChange={e => setMySalary(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <label className="text-sm text-gray-400 block mb-3">
              How much of your salary are you willing to save?
            </label>
            <div className="flex flex-wrap gap-2 mb-6">
              {savingsOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setMySavingsPct(opt)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mySavingsPct === opt
                      ? 'bg-pink-600 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {opt}%
                </button>
              ))}
            </div>

            {mySalary && (
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 mb-5">
                <p className="text-pink-300 text-sm">
                  You'll save{' '}
                  <span className="font-bold text-white">
                    {fmt(Math.round(Number(mySalary) * mySavingsPct / 100))}
                  </span>{' '}
                  per month ({mySavingsPct}%) —{' '}
                  <span className="font-bold text-white">
                    {fmt(Math.round(Number(mySalary) * (1 - mySavingsPct / 100)))}
                  </span>{' '}
                  goes toward shared expenses
                </p>
              </div>
            )}

            <button
              onClick={saveStep1}
              disabled={loading || !mySalary}
              className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? 'Saving...' : 'Next — Fixed costs →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Fixed costs ── */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-1">Fixed monthly costs</h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter your shared and personal fixed expenses
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">🏠 Monthly rent (shared)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 30000"
                    value={rent}
                    onChange={e => setRent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">🚌 Your commute / travel</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 3000"
                    value={myCommute}
                    onChange={e => setMyCommute(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  ⚡ Other fixed (subscriptions, EMIs, utilities)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={otherFixed}
                    onChange={e => setOtherFixed(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-xs mt-4">
              💡 Your partner can update their commute from their own dashboard
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setStep(1); setError(''); }}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-all"
              >
                ← Back
              </button>
              <button
                onClick={calculateBreakdown}
                disabled={loading || !rent}
                className="flex-1 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
              >
                {loading ? 'Calculating...' : 'Calculate our budget →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Results ── */}
        {step === 3 && breakdown && (
          <div className="space-y-5">

            {/* Combined overview */}
            <div className="bg-gradient-to-br from-pink-900/60 to-purple-900/60 border border-pink-500/20 rounded-2xl p-6">
              <p className="text-pink-300 text-xs font-medium uppercase tracking-wider mb-4">
                Combined picture
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">{breakdown.user1.name}'s salary</p>
                  <p className="text-2xl font-bold">{fmt(breakdown.user1.salary)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">
                    {breakdown.user2?.name || 'Partner'}'s salary
                  </p>
                  <p className="text-2xl font-bold">{fmt(breakdown.user2?.salary || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Combined income</p>
                  <p className="text-xl font-semibold text-pink-300">{fmt(breakdown.combinedSalary)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Fixed costs</p>
                  <p className="text-xl font-semibold text-red-400">{fmt(breakdown.fixedExpenses)}</p>
                </div>
              </div>
            </div>

            {/* Personal savings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-gray-400 text-xs mb-1">{breakdown.user1.name}'s savings</p>
                <p className="text-xl font-bold text-green-400">{fmt(breakdown.user1.personalSavings)}</p>
                <p className="text-gray-500 text-xs mt-1">personal savings / month</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-gray-400 text-xs mb-1">
                  {breakdown.user2?.name || 'Partner'}'s savings
                </p>
                <p className="text-xl font-bold text-green-400">
                  {fmt(breakdown.user2?.personalSavings || 0)}
                </p>
                <p className="text-gray-500 text-xs mt-1">personal savings / month</p>
              </div>
            </div>

            {/* Joint contributions */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-pink-300">Joint account</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">{breakdown.user1.name} contributes</span>
                  <span className="font-bold">{fmt(breakdown.contributions.user1Amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">
                    {breakdown.user2?.name || 'Partner'} contributes
                  </span>
                  <span className="font-bold">{fmt(breakdown.contributions.user2Amount)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Rent</span>
                  <span className="font-bold text-red-400">− {fmt(breakdown.rent)}</span>
                </div>
                {breakdown.coupleGoalsSaving > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Couple goals saving</span>
                    <span className="font-bold text-amber-400">− {fmt(breakdown.coupleGoalsSaving)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white font-medium">Free to spend together</span>
                  <span className="font-bold text-2xl text-pink-300">{fmt(breakdown.spendable)}</span>
                </div>
              </div>
            </div>

            {/* Suggested split */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-1">Suggested monthly split</h3>
              <p className="text-gray-500 text-xs mb-4">
                Of your {fmt(breakdown.spendable)} joint spending money
              </p>
              <div className="space-y-3">
                {Object.entries(breakdown.suggestions).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {key === 'food' ? '🍽️' :
                         key === 'groceries' ? '🛒' :
                         key === 'outing' ? '🎬' : '✨'}
                      </span>
                      <span className="text-gray-300 capitalize">{key}</span>
                    </div>
                    <span className="font-semibold">{fmt(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Goals CTA */}
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/20 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Planning a big purchase?</p>
                <p className="text-gray-400 text-sm">Add couple goals like a scooter or vacation</p>
              </div>
              <button
                onClick={() => navigate('/goals')}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap"
              >
                Add goals →
              </button>
            </div>

            <button
              onClick={() => { setStep(1); setError(''); setBreakdown(null); }}
              className="w-full text-sm text-gray-500 hover:text-gray-300 py-2 transition-colors"
            >
              ← Recalculate with different numbers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
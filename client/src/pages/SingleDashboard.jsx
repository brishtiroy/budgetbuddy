import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SingleDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [salary, setSalary] = useState('');
  const [savingsPct, setSavingsPct] = useState(20);

  // Step 2
  const [rent, setRent] = useState('');
  const [commute, setCommute] = useState('');
  const [otherFixed, setOtherFixed] = useState('');

  // Step 3 — Results & Phase 2/3 Live Data
  const [breakdown, setBreakdown] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [expensesList, setExpensesList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reminderDay, setReminderDay] = useState(user.reminderDay || 1);

  // Expense Form State (Feature 4)
  const [addingExpense, setAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'food', description: '' });

  const savingsOptions = [10, 15, 20, 25, 30, 40, 50];
  const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  async function saveStep1() {
    if (!salary) return setError('Enter your monthly salary');
    setError('');
    setLoading(true);
    try {
      await api.put('/budget/salary', { salary: Number(salary), savingsPercent: savingsPct });
      setStep(2);
    } catch {
      setError('Failed to save salary');
    } finally {
      setLoading(false);
    }
  }

  async function calculate() {
    if (!rent) return setError('Enter your monthly rent');
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/budget/single-breakdown', {
        rent: Number(rent),
        commute: Number(commute) || 0,
        otherFixed: Number(otherFixed) || 0,
      });
      setBreakdown(res.data);
      setStep(3);
      // Fetch live analytics and expense tracking when reaching Step 3
      fetchLiveDashboardData();
    } catch {
      setError('Failed to calculate');
    } finally {
      setLoading(false);
    }
  }

  // Fetch live Phase 2/3 Data (Expenses & Analytics)
  async function fetchLiveDashboardData() {
    try {
      const [summaryRes, listRes, analyticsRes] = await Promise.all([
        api.get('/expenses/summary'),
        api.get('/expenses'),
        api.get('/analytics/overview')
      ]);
      setExpenseSummary(summaryRes.data);
      setExpensesList(listRes.data.personalExpenses || []);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to load live tracking data:', err);
    }
  }

  // Feature 4: Log a Daily Expense
  async function handleAddExpense(e) {
    e.preventDefault();
    if (!expenseForm.amount) return alert('Please enter an amount');
    setAddingExpense(true);
    try {
      await api.post('/expenses', {
        ...expenseForm,
        amount: Number(expenseForm.amount),
        type: 'personal'
      });
      setExpenseForm({ amount: '', category: 'food', description: '' });
      fetchLiveDashboardData(); // Refresh remaining balance dynamically
    } catch (err) {
      alert('Failed to log expense');
    } finally {
      setAddingExpense(false);
    }
  }

  // Feature 8: Update Automated Email Reminder Day
  async function handleUpdateReminder(day) {
    setReminderDay(day);
    try {
      // Piggyback on salary update or custom user update
      await api.put('/budget/salary', { salary: Number(salary) || breakdown.salary, savingsPercent: savingsPct, reminderDay: day });
      const updatedUser = { ...user, reminderDay: day };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert(`Automated email reminder set for Day ${day} of every month! 💌`);
    } catch (err) {
      console.error('Failed to update reminder day');
    }
  }

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="text-xl font-bold">BudgetBuddy</span>
          <span className="ml-2 text-xs bg-purple-600/30 text-purple-300 border border-purple-600/40 px-2 py-0.5 rounded-full">Solo</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/goals')} className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all">Goals</button>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all">Logout</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-1">Hey, {user.name} 👋</h1>
        <p className="text-gray-400 mb-8">Let's plan your month</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Income', 'Fixed costs', 'Your budget'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${step > i + 1 ? 'text-green-400' : step === i + 1 ? 'text-white' : 'text-gray-600'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border ${step > i + 1 ? 'bg-green-500/20 border-green-500 text-green-400' :
                  step === i + 1 ? 'bg-purple-600 border-purple-500 text-white' :
                    'border-gray-700 text-gray-600'
                  }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="text-sm hidden sm:block">{label}</span>
              </div>
              {i < 2 && <div className={`h-px w-8 ${step > i + 1 ? 'bg-green-500/50' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-xl p-3 mb-5 text-sm">{error}</div>
        )}

        {/* Step 1 — Income */}
        {step === 1 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-1">Your income</h2>
            <p className="text-gray-400 text-sm mb-6">We'll use this to plan everything else</p>

            <label className="text-sm text-gray-400 block mb-1">Monthly salary (take-home)</label>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number" placeholder="e.g. 75000"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <label className="text-sm text-gray-400 block mb-3">How much are you willing to save each month?</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {savingsOptions.map(opt => (
                <button key={opt} onClick={() => setSavingsPct(opt)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${savingsPct === opt ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}>
                  {opt}%
                </button>
              ))}
            </div>

            {salary && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-5">
                <p className="text-purple-300 text-sm">
                  You'll save <span className="font-bold text-white">{fmt(Math.round(Number(salary) * savingsPct / 100))}</span> per month
                  &nbsp;— <span className="font-bold text-white">{fmt(Math.round(Number(salary) * (1 - savingsPct / 100)))}</span> left for expenses
                </p>
              </div>
            )}

            <button onClick={saveStep1} disabled={loading || !salary}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all">
              {loading ? 'Saving...' : 'Next — Fixed costs →'}
            </button>
          </div>
        )}

        {/* Step 2 — Fixed costs */}
        {step === 2 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-1">Fixed monthly costs</h2>
            <p className="text-gray-400 text-sm mb-6">These come off the top before we split the rest</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">🏠 Rent</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input type="number" placeholder="e.g. 18000"
                    value={rent} onChange={e => setRent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">🚌 Monthly commute / travel</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input type="number" placeholder="e.g. 3000"
                    value={commute} onChange={e => setCommute(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">⚡ Other fixed (subscriptions, EMIs, utilities)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input type="number" placeholder="e.g. 5000"
                    value={otherFixed} onChange={e => setOtherFixed(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {salary && rent && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mt-5">
                <p className="text-purple-300 text-sm">
                  After savings + fixed costs, you'll have&nbsp;
                  <span className="font-bold text-white">
                    {fmt(Math.max(
                      Math.round(Number(salary) * (1 - savingsPct / 100)) - Number(rent) - Number(commute || 0) - Number(otherFixed || 0),
                      0
                    ))}
                  </span> to spend freely
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-all">
                ← Back
              </button>
              <button onClick={calculate} disabled={loading || !rent}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all">
                {loading ? 'Calculating...' : 'Show my budget →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Results & Advanced Tracking */}
        {step === 3 && breakdown && (
          <div className="space-y-5">

            {/* Summary cards (Enhanced with Live Spendable Cash) */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Monthly income', value: breakdown.salary, color: 'from-purple-900/60 to-purple-800/40', accent: 'text-purple-300' },
                { label: 'Going to savings', value: breakdown.monthlySavings, color: 'from-green-900/60 to-green-800/40', accent: 'text-green-300' },
                { label: 'Fixed expenses', value: breakdown.fixedExpenses, color: 'from-red-900/60 to-red-800/40', accent: 'text-red-300' },
                {
                  label: expenseSummary ? 'Live Spendable Cash' : 'Free to spend',
                  value: expenseSummary ? expenseSummary.remainingSpendableMoney : breakdown.spendable,
                  color: 'from-blue-900/60 to-blue-800/40',
                  accent: 'text-blue-300'
                },
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} border border-white/10 rounded-2xl p-4`}>
                  <p className={`text-xs font-medium mb-1 ${card.accent}`}>{card.label}</p>
                  <p className="text-2xl font-bold">{fmt(card.value)}</p>
                  {card.label === 'Live Spendable Cash' && (
                    <p className="text-[10px] text-blue-200 mt-0.5">Updated with daily expenses</p>
                  )}
                </div>
              ))}
            </div>

            {/* NEW: Feature 9 — All-Time Analytics KPI Block */}
            {analytics && (
              <div className="bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/30 rounded-2xl p-5">
                <h3 className="font-semibold text-purple-300 mb-3 flex items-center justify-between text-sm">
                  <span>📈 Financial Progress & Efficiency</span>
                  <span className="text-xs bg-purple-500/20 px-2 py-0.5 rounded-full text-white">All-Time Stats</span>
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <p className="text-[11px] text-gray-400">Success Rate</p>
                    <p className="text-lg font-bold text-green-400">{analytics.successRate || '0%'}</p>
                    <p className="text-[9px] text-gray-500">{analytics.completed || 0}/{analytics.totalGoals || 0} goals</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <p className="text-[11px] text-gray-400">Total Saved</p>
                    <p className="text-lg font-bold text-purple-300">{fmt(analytics.totalSavedAllTime)}</p>
                    <p className="text-[9px] text-gray-500">across all goals</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                    <p className="text-[11px] text-gray-400">Time Efficiency</p>
                    <p className="text-lg font-bold text-blue-400">{analytics.timeEfficiency?.early || 0} Early</p>
                    <p className="text-[9px] text-gray-500">{analytics.timeEfficiency?.onTime || 0} On Time</p>
                  </div>
                </div>
              </div>
            )}

            {/* NEW: Feature 4 — Live Daily Expense Logger */}
            <div className="bg-white/5 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-blue-300">🛒 Daily Expense Tracker</h3>
                  <p className="text-xs text-gray-400">Log purchases to see your real-time spendable cash</p>
                </div>
                <span className="text-xs bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-lg">
                  Spent: {fmt(expenseSummary?.variableExpensesLogged || 0)}
                </span>
              </div>

              {/* Expense input form */}
              <form onSubmit={handleAddExpense} className="space-y-3 mb-5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative col-span-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-7 pr-2 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="col-span-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500 capitalize"
                  >
                    {['food', 'groceries', 'outing', 'misc', 'other'].map(cat => (
                      <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Note (optional)"
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="col-span-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingExpense}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-xl transition-all shadow-md shadow-blue-900/20"
                >
                  {addingExpense ? 'Logging...' : '+ Add Expense to Ledger'}
                </button>
              </form>

              {/* Recent spending ledger */}
              {expensesList.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-[11px] text-gray-400 mb-2 font-medium">RECENT PURCHASES THIS MONTH</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {expensesList.map(exp => (
                      <div key={exp._id} className="flex justify-between items-center text-xs bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                          <span>{exp.category === 'food' ? '🍽️' : exp.category === 'groceries' ? '🛒' : exp.category === 'outing' ? '🎬' : '✨'}</span>
                          <div>
                            <p className="font-medium text-gray-300 capitalize">{exp.category}</p>
                            {exp.description && <p className="text-[10px] text-gray-500">{exp.description}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-red-400">− {fmt(exp.amount)}</span>
                          <p className="text-[9px] text-gray-500">{new Date(exp.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggested split */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold mb-1">Suggested monthly split</h3>
              <p className="text-gray-500 text-xs mb-4">Of your {fmt(breakdown.spendable)} free spending money</p>
              <div className="space-y-3">
                {Object.entries(breakdown.suggestions).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{key === 'food' ? '🍽️' : key === 'groceries' ? '🛒' : key === 'outing' ? '🎬' : '✨'}</span>
                      <span className="text-gray-300 capitalize">{key}</span>
                    </div>
                    <span className="font-semibold">{fmt(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed cost breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold mb-3 text-gray-300">Fixed costs breakdown</h3>
              <div className="space-y-2">
                {[
                  { label: '🏠 Rent', val: breakdown.rent },
                  { label: '🚌 Commute', val: breakdown.commute },
                  { label: '⚡ Other fixed', val: breakdown.otherFixed },
                ].filter(i => i.val > 0).map(item => (
                  <div key={item.label} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white">{fmt(item.val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NEW: Feature 8 — Automated Email Reminder Selector */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <span>⏰ Monthly Savings Email Reminder</span>
                </p>
                <p className="text-gray-400 text-xs">Pick which day of the month you get your automated check-in email</p>
              </div>
              <select
                value={reminderDay}
                onChange={e => handleUpdateReminder(Number(e.target.value))}
                className="bg-black/50 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-purple-300 focus:outline-none focus:border-purple-500 font-semibold"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day} className="bg-gray-900">
                    Day {day} of month
                  </option>
                ))}
              </select>
            </div>

            {/* Goals CTA */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/20 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">Planning a big purchase?</p>
                <p className="text-gray-400 text-sm">Set a goal and we'll tell you how much to save monthly</p>
              </div>
              <button onClick={() => navigate('/goals')}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all whitespace-nowrap">
                Add goals →
              </button>
            </div>

            <button onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-gray-300 py-2 transition-colors">
              ← Recalculate with different numbers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
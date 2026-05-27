import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import HabitCard from './HabitCard';
import HabitHeatmap from './HabitHeatmap';
import { Plus, Flame, Target, Zap, X, Filter } from 'lucide-react';

const CATEGORIES = [
  { name: 'All', icon: '🎯' },
  { name: 'Routine', icon: '🔄' },
  { name: 'Fitness', icon: '🏋️‍♂️' },
  { name: 'Mind', icon: '🧠' },
  { name: 'Work', icon: '💼' },
  { name: 'Health', icon: '🍎' },
];

const COLORS = [
  { id: 'emerald', label: 'Emerald', value: 'hsl(160, 84%, 39%)' },
  { id: 'indigo', label: 'Indigo', value: 'hsl(226, 84%, 55%)' },
  { id: 'rose', label: 'Rose', value: 'hsl(346, 84%, 55%)' },
  { id: 'amber', label: 'Amber', value: 'hsl(38, 92%, 50%)' },
  { id: 'violet', label: 'Violet', value: 'hsl(266, 84%, 60%)' },
];

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitCategory, setHabitCategory] = useState('Routine');
  const [habitColor, setHabitColor] = useState('emerald');

  const todayStr = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const data = await api.getHabits(todayStr);
      setHabits(data);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingHabitId(null);
    setHabitName('');
    setHabitDesc('');
    setHabitCategory('Routine');
    setHabitColor('emerald');
    setModalOpen(true);
  };

  const openEditModal = (habit) => {
    setModalMode('edit');
    setEditingHabitId(habit._id);
    setHabitName(habit.name);
    setHabitDesc(habit.description || '');
    setHabitCategory(habit.category || 'Routine');
    setHabitColor(habit.color || 'emerald');
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    try {
      if (modalMode === 'create') {
        const habit = await api.createHabit(
          habitName.trim(),
          habitDesc.trim(),
          habitCategory,
          habitColor,
          todayStr
        );
        setHabits(prev => [habit, ...prev]);
      } else {
        const updated = await api.updateHabit(
          editingHabitId,
          {
            name: habitName.trim(),
            description: habitDesc.trim(),
            category: habitCategory,
            color: habitColor,
          },
          todayStr
        );
        handleUpdate(updated);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save habit:', err);
    }
  };

  const handleUpdate = (updatedHabit) => {
    setHabits(prev =>
      prev.map(h => (h._id === updatedHabit._id ? updatedHabit : h))
    );
  };

  const handleDelete = (id) => {
    setHabits(prev => prev.filter(h => h._id !== id));
  };

  // Compute aggregate stats
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completions?.includes(todayStr)).length;
  const totalCurrentStreak = habits.reduce((sum, h) => sum + (h.currentStreak || 0), 0);

  // Filtered habits
  const filteredHabits = selectedCategory === 'All'
    ? habits
    : habits.filter(h => h.category === selectedCategory);

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalHabits}</div>
          <div className="stat-label">Active Habits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedToday}/{totalHabits}</div>
          <div className="stat-label">Completed Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <Flame size={24} /> {totalCurrentStreak}
          </div>
          <div className="stat-label">Total Streak Days</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        {/* Category Filters */}
        <div className="category-filters-container">
          <Filter size={14} className="filter-icon" />
          <div className="category-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                className={`filter-pill ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span className="cat-emoji">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Habit Button */}
        <button className="btn-add" onClick={openCreateModal}>
          <Plus size={18} />
          Add Habit
        </button>
      </div>

      {/* Heatmap */}
      <HabitHeatmap habits={habits} />

      {/* Habit List */}
      <div className="section-header">
        <Target size={16} className="icon" />
        {selectedCategory === 'All' ? 'Your Habits' : `${selectedCategory} Habits`}
      </div>

      {filteredHabits.length === 0 ? (
        <div className="empty-state">
          <Zap size={48} className="icon" />
          <h3>No habits found</h3>
          <p>
            {selectedCategory === 'All'
              ? "Add your first habit to start building streaks!"
              : `You don't have any habits in the "${selectedCategory}" category.`}
          </p>
        </div>
      ) : (
        <div className="habit-list">
          {filteredHabits.map(habit => (
            <HabitCard
              key={habit._id}
              habit={habit}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onEditClick={() => openEditModal(habit)}
              clientDate={todayStr}
            />
          ))}
        </div>
      )}

      {/* Habit Modal (Create / Edit) */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <X size={20} />
            </button>
            <h2>{modalMode === 'create' ? 'Create New Habit' : 'Edit Habit'}</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label htmlFor="habit-name">Habit Name</label>
                <input
                  id="habit-name"
                  type="text"
                  placeholder="e.g., Read for 30 mins, Gym, Meditate"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  required
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="habit-desc">Description (Optional)</label>
                <textarea
                  id="habit-desc"
                  placeholder="e.g., Read morning chapter of currently reading book"
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  maxLength={150}
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <div className="modal-category-grid">
                  {CATEGORIES.filter(c => c.name !== 'All').map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      className={`modal-category-option ${habitCategory === cat.name ? 'selected' : ''}`}
                      onClick={() => setHabitCategory(cat.name)}
                    >
                      <span className="modal-cat-icon">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Theme Color</label>
                <div className="modal-color-grid">
                  {COLORS.map(col => (
                    <button
                      key={col.id}
                      type="button"
                      className={`modal-color-option ${habitColor === col.id ? 'selected' : ''}`}
                      style={{ '--color-value': col.value }}
                      onClick={() => setHabitColor(col.id)}
                      title={col.label}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary modal-submit">
                {modalMode === 'create' ? 'Create Habit' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

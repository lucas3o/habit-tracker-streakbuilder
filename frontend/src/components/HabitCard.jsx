import { useState, useMemo } from 'react';
import { Check, Trash2, Flame, Trophy, Edit2 } from 'lucide-react';
import { api } from '../utils/api';

const CATEGORY_ICONS = {
  Routine: '🔄',
  Fitness: '🏋️‍♂️',
  Mind: '🧠',
  Work: '💼',
  Health: '🍎',
};

export default function HabitCard({ habit, onUpdate, onDelete, onEditClick, clientDate }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCompletedToday = habit.completions?.includes(clientDate);
  const colorClass = `color-${habit.color || 'emerald'}`;

  // Get last 7 days (today is the last item)
  const last7Days = useMemo(() => {
    const result = [];
    const refDateObj = new Date(clientDate + 'T00:00:00');
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(refDateObj);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, etc.
      const shortNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      result.push({
        dateStr,
        dayNum: d.getDate(),
        dayLabel: shortNames[dayOfWeek],
        isToday: i === 0,
      });
    }
    return result;
  }, [clientDate]);

  const handleToggle = async (dateToToggle) => {
    setToggling(true);
    try {
      const updated = await api.toggleHabit(habit._id, dateToToggle, clientDate);
      onUpdate(updated);
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${habit.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteHabit(habit._id);
      onDelete(habit._id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const catIcon = CATEGORY_ICONS[habit.category] || '🔄';

  return (
    <div className={`habit-card ${colorClass} ${isCompletedToday ? 'completed' : ''}`}>
      {/* Complete Today Button */}
      <button
        className={`check-btn ${isCompletedToday ? 'checked' : ''}`}
        onClick={() => handleToggle(clientDate)}
        disabled={toggling}
        aria-label={`Toggle ${habit.name} today`}
      >
        <Check size={20} strokeWidth={3} />
      </button>

      {/* Habit Details */}
      <div className="habit-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
          <span className="habit-category-badge" title={`Category: ${habit.category}`}>
            {catIcon} {habit.category}
          </span>
          <div className="habit-name">{habit.name}</div>
        </div>
        {habit.description && <div className="habit-description">{habit.description}</div>}
        
        {/* Weekly Log Grid */}
        <div className="weekly-log">
          {last7Days.map(day => {
            const isCompleted = habit.completions?.includes(day.dateStr);
            return (
              <div 
                key={day.dateStr} 
                className={`weekly-day ${day.isToday ? 'today' : ''}`}
              >
                <span className="weekly-day-label">{day.dayLabel}</span>
                <button
                  type="button"
                  className={`weekly-check-btn ${isCompleted ? 'checked' : ''}`}
                  onClick={() => handleToggle(day.dateStr)}
                  disabled={toggling}
                  title={`${isCompleted ? 'Complete' : 'Pending'} on ${day.dateStr}`}
                >
                  {isCompleted ? <Check size={10} strokeWidth={3} /> : day.dayNum}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Stats */}
      <div className="habit-stats">
        <div className={`streak-badge ${habit.currentStreak > 0 ? 'streak-animate' : ''}`} title="Current Streak">
          <Flame size={16} className="icon" />
          {habit.currentStreak || 0}
        </div>
        <div className="streak-badge best" title="Longest Streak">
          <Trophy size={15} className="icon" />
          {habit.longestStreak || 0}
        </div>
      </div>

      {/* Actions */}
      <div className="habit-actions">
        <button
          className="btn-action btn-edit"
          onClick={onEditClick}
          aria-label={`Edit ${habit.name}`}
          title="Edit Habit"
        >
          <Edit2 size={15} />
        </button>
        <button
          className="btn-danger"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete ${habit.name}`}
          title="Delete Habit"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

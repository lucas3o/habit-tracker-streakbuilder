import { useMemo } from 'react';
import { Activity } from 'lucide-react';

export default function HabitHeatmap({ habits }) {
  const heatmapData = useMemo(() => {
    const days = 90;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cells = [];

    // Count completions per day across all habits
    const completionMap = {};
    const totalHabits = habits.length || 1;

    habits.forEach(habit => {
      (habit.completions || []).forEach(dateStr => {
        completionMap[dateStr] = (completionMap[dateStr] || 0) + 1;
      });
    });

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = completionMap[dateStr] || 0;
      const ratio = count / totalHabits;

      let level = 0;
      if (ratio > 0 && ratio <= 0.25) level = 1;
      else if (ratio > 0.25 && ratio <= 0.5) level = 2;
      else if (ratio > 0.5 && ratio <= 0.75) level = 3;
      else if (ratio > 0.75) level = 4;

      cells.push({
        date: dateStr,
        count,
        level,
        dayOfWeek: d.getDay(),
        month: d.toLocaleString('default', { month: 'short' }),
      });
    }

    // Group into weeks (columns)
    const weeks = [];
    let currentWeek = [];

    // Pad the first week if it doesn't start on Sunday
    if (cells.length > 0) {
      const firstDayOfWeek = cells[0].dayOfWeek;
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }
    }

    cells.forEach(cell => {
      currentWeek.push(cell);
      if (cell.dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Get month labels
    const monthLabels = [];
    let lastMonth = '';
    weeks.forEach((week, i) => {
      const firstValidCell = week.find(c => c !== null);
      if (firstValidCell && firstValidCell.month !== lastMonth) {
        monthLabels.push({ label: firstValidCell.month, index: i });
        lastMonth = firstValidCell.month;
      }
    });

    return { weeks, monthLabels };
  }, [habits]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="heatmap-container">
      <div className="section-header">
        <Activity size={16} className="icon" />
        Activity — Last 90 Days
      </div>

      <div style={{ display: 'flex' }}>
        <div className="heatmap-day-labels">
          {dayLabels.map((label, i) => (
            <span key={i} style={{ height: '14px', lineHeight: '14px' }}>{label}</span>
          ))}
        </div>

        <div>
          <div className="heatmap-month-labels">
            {heatmapData.monthLabels.map((m, i) => (
              <span key={i} style={{ position: 'relative', left: `${m.index * 17}px` }}>
                {m.label}
              </span>
            ))}
          </div>

          <div className="heatmap-grid">
            {heatmapData.weeks.map((week, wi) => (
              <div className="heatmap-week" key={wi}>
                {week.map((cell, ci) =>
                  cell ? (
                    <div
                      key={ci}
                      className={`heatmap-cell level-${cell.level}`}
                    >
                      <div className="tooltip">
                        {cell.date}: {cell.count} habit{cell.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ) : (
                    <div key={ci} style={{ width: 14, height: 14 }} />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-cell" style={{ background: 'hsla(224, 50%, 15%, 0.5)' }} />
        <div className="legend-cell" style={{ background: 'hsla(160, 84%, 39%, 0.2)' }} />
        <div className="legend-cell" style={{ background: 'hsla(160, 84%, 39%, 0.4)' }} />
        <div className="legend-cell" style={{ background: 'hsla(160, 84%, 39%, 0.6)' }} />
        <div className="legend-cell" style={{ background: 'hsl(160, 84%, 39%)' }} />
        <span>More</span>
      </div>
    </div>
  );
}

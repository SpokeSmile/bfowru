import useClocks from '../hooks/useClocks.js';

export default function ClockPanel() {
  const clocks = useClocks();
  const entries = [
    ['UTC', clocks.utc],
    ['YOUR', clocks.local],
    ['CET', clocks.cet],
  ];

  return (
    <div className="sf-clock-panel">
      {entries.map(([label, value]) => {
        const isActive = label === 'YOUR';

        return (
          <div className={`sf-clock-card-wrap ${isActive ? 'sf-clock-card-wrap--active' : ''}`} key={label}>
            {isActive ? <span className="sf-clock-card-accent" aria-hidden="true" /> : null}
            <div className="sf-clock-card">
              <div className="sf-clock-time">{value}</div>
              <div className="sf-clock-label">{label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

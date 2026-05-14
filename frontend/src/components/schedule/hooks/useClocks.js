import { useEffect, useState } from 'react';

function formatClock(timeZone) {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  if (timeZone) {
    options.timeZone = timeZone;
  }

  return new Intl.DateTimeFormat('ru-RU', options).format(new Date());
}

export default function useClocks() {
  const [clocks, setClocks] = useState({
    utc: '--:--',
    local: '--:--',
    cet: '--:--',
  });

  useEffect(() => {
    const update = () => {
      setClocks({
        utc: formatClock('UTC'),
        local: formatClock(),
        cet: formatClock('Europe/Berlin'),
      });
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return clocks;
}

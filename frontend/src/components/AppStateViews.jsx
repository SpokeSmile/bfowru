import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoadingView() {
  return (
    <motion.main
      className="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="loading-screen-card" aria-label="Loading data">
        <div className="loading-progress" aria-hidden="true">
          <span className="loading-progress-fill" />
        </div>
        <svg className="loading-arc-spinner" viewBox="0 0 64 64" aria-hidden="true">
          <circle className="loading-arc-track" cx="32" cy="32" r="25" pathLength="100" />
          <circle className="loading-arc-line" cx="32" cy="32" r="25" pathLength="100" />
        </svg>
      </div>
    </motion.main>
  );
}

export function ErrorView({ error, onRetry }) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="glass-panel max-w-md rounded-xl px-8 py-6 text-center">
        <AlertTriangle className="mx-auto text-red-300" />
        <div className="mt-3 font-black uppercase">Не удалось загрузить данные</div>
        <p className="mt-2 text-bf-cream/60">{error}</p>
        <button className="mt-5 rounded-xl bg-bf-orange px-5 py-3 font-black text-black" type="button" onClick={onRetry}>
          Повторить
        </button>
      </div>
    </main>
  );
}

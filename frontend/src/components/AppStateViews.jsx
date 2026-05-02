import { AlertTriangle, RefreshCw } from 'lucide-react';

export function LoadingView() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="glass-panel rounded-xl px-8 py-6 text-center">
        <RefreshCw className="mx-auto animate-spin text-bf-orange" />
        <div className="mt-3 font-black uppercase">Загрузка данных</div>
      </div>
    </main>
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

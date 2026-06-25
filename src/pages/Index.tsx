/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

interface Loc { name: string; region: string; coords: [number, number]; emoji: string; }

const LOCATIONS: Loc[] = [
  { name: 'Красная площадь',      region: 'Москва',            coords: [55.7536, 37.6210], emoji: '🏛️' },
  { name: 'Тверская улица',       region: 'Москва',            coords: [55.7649, 37.6055], emoji: '🌃' },
  { name: 'Невский проспект',     region: 'Санкт-Петербург',   coords: [59.9343, 30.3351], emoji: '🌉' },
  { name: 'Дворцовая площадь',    region: 'Санкт-Петербург',   coords: [59.9390, 30.3158], emoji: '🏰' },
  { name: 'Улица Баумана',        region: 'Казань',            coords: [55.7944, 49.1183], emoji: '🕌' },
  { name: 'Площадь 1905 года',    region: 'Екатеринбург',      coords: [56.8378, 60.5975], emoji: '🏙️' },
  { name: 'Большая Покровская',   region: 'Нижний Новгород',   coords: [56.3225, 44.0048], emoji: '🚶' },
  { name: 'Центральная набережная', region: 'Сочи',            coords: [43.5810, 39.7203], emoji: '🌴' },
  { name: 'Площадь Ленина',       region: 'Новосибирск',       coords: [55.0302, 82.9204], emoji: '🎭' },
  { name: 'Светланская улица',    region: 'Владивосток',       coords: [43.1155, 131.8855], emoji: '🚢' },
  { name: 'Площадь Победы',       region: 'Калининград',       coords: [54.7156, 20.5070], emoji: '⛪' },
  { name: 'Проспект Мира',        region: 'Красноярск',        coords: [56.0106, 92.8526], emoji: '🌲' },
  { name: 'Улица Кирова',         region: 'Самара',            coords: [53.1959, 50.1002], emoji: '🏘️' },
  { name: 'Арбат',                region: 'Москва',            coords: [55.7508, 37.5936], emoji: '🎨' },
];

declare global { interface Window { ymaps: any } }

type Stage = 'closed' | 'opening' | 'loading' | 'revealed';

export default function Index() {
  const [stage, setStage]     = useState<Stage>('closed');
  const [loc, setLoc]         = useState<Loc | null>(null);
  const [visited, setVisited] = useState(0);
  const panoRef   = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const ymapsRef  = useRef<any>(null);

  // Грузим ключ с бэкенда, потом динамически вставляем скрипт Яндекса
  useEffect(() => {
    const CONFIG_URL = 'https://functions.poehali.dev/bc40d8ff-1a1b-4c92-b07a-7a5d40abe34c';

    const waitForYmaps = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => { ymapsRef.current = window.ymaps; });
      } else {
        setTimeout(waitForYmaps, 200);
      }
    };

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&load=package.full&apikey=850caa6b-ee34-496f-b574-dbd33b441cdd`;
    script.onload = waitForYmaps;
    document.head.appendChild(script);
  }, []);

  const destroyPlayer = () => {
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (_e) { /* ignore */ }
      playerRef.current = null;
    }
  };

  const mountPlayer = useCallback((pano: any) => {
    if (!panoRef.current) return;
    destroyPlayer();
    panoRef.current.innerHTML = '';
    playerRef.current = new ymapsRef.current.panorama.Player(
      panoRef.current, pano,
      { controls: ['zoomControl', 'panoramaControl'], suppressMapOpenBlock: true }
    );
  }, []);

  const tryLocations = useCallback((pool: Loc[], onDone: (l: Loc, pano: any) => void) => {
    if (!pool.length || !ymapsRef.current) { console.log('[RUS] tryLocations: pool empty or no ymaps'); return; }
    const idx       = Math.floor(Math.random() * pool.length);
    const candidate = pool[idx];
    const rest      = pool.filter((_, i) => i !== idx);
    console.log('[RUS] locate:', candidate.name, candidate.coords);
    ymapsRef.current.panorama
      .locate(candidate.coords)
      .then((list: any[]) => {
        console.log('[RUS] locate result:', candidate.name, list.length);
        if (list.length > 0) onDone(candidate, list[0]);
        else tryLocations(rest, onDone);
      })
      .catch((e: any) => { console.error('[RUS] locate error:', e); tryLocations(rest, onDone); });
  }, []);

  const openDoor = useCallback(() => {
    if (stage === 'opening' || stage === 'loading') return;
    destroyPlayer();
    setStage('opening');
    setVisited(v => v + 1);

    // Ждём анимацию двери (1.1с), потом ищем панораму
    setTimeout(() => {
      setStage('loading');
      const doSearch = () => {
        if (!ymapsRef.current) { setTimeout(doSearch, 200); return; }
        tryLocations([...LOCATIONS], (found, pano) => {
          setLoc(found);
          setStage('revealed');
          // После revealed React рендерит panoRef → монтируем плеер
          requestAnimationFrame(() => requestAnimationFrame(() => mountPlayer(pano)));
        });
      };
      doSearch();
    }, 1100);
  }, [stage, tryLocations, mountPlayer]);

  const reset = () => {
    destroyPlayer();
    setStage('closed');
    setLoc(null);
  };

  useEffect(() => () => destroyPlayer(), []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-aurora">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-secondary/20 blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center font-display text-2xl font-black">
          <span className="text-primary text-glow-pink">Rus</span>
          <span className="text-secondary text-glow-cyan">secret</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm backdrop-blur">
          <Icon name="MapPin" size={16} className="text-accent" />
          <span className="text-muted-foreground">Открыто:</span>
          <span className="font-display font-bold text-accent">{visited}</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-4 md:pt-10">

        {/* Hero-текст — только на главном экране */}
        {stage === 'closed' && (
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-secondary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
              телепорт по России
            </div>
            <h1 className="font-display text-4xl font-black leading-tight md:text-6xl">
              Открой дверь —<br />
              <span className="text-primary text-glow-pink">окажись где угодно</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Одно нажатие — и ты в случайной точке России.<br />
              Гуляй по панораме, ходи по улицам, меняй время съёмки.
            </p>
          </div>
        )}

        {/* === ДВЕРЬ === */}
        {(stage === 'closed' || stage === 'opening' || stage === 'loading') && (
          <div className="flex justify-center">
            <button
              onClick={openDoor}
              disabled={stage !== 'closed'}
              className="group relative"
              aria-label="Открыть секретную дверь"
            >
              <div className={`door-glow relative h-[420px] w-[260px] rounded-[2rem] border-4 border-accent/70 bg-gradient-to-b from-card to-background p-2 transition-transform duration-300 ${stage === 'closed' ? 'animate-float group-hover:scale-[1.03]' : ''}`}>
                {/* Свет позади двери */}
                <div className="absolute inset-2 overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-primary via-secondary to-accent" />
                {/* Полотно двери */}
                <div className={`absolute inset-2 origin-left overflow-hidden rounded-[1.6rem] border-2 border-border bg-gradient-to-b from-[#1a1230] to-[#0d0820] ${stage === 'opening' ? 'animate-door-open' : ''}`}>
                  <div className="flex h-full flex-col items-center justify-center gap-4">
                    {stage === 'loading' ? (
                      <>
                        <div className="text-6xl animate-pulse">🌍</div>
                        <div className="rounded-full border border-secondary/50 px-4 py-1 font-display text-xs uppercase tracking-widest text-secondary">
                          ищем место...
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-7xl">🚪</div>
                        <div className="rounded-full border border-accent/50 px-4 py-1 font-display text-xs uppercase tracking-widest text-accent">
                          нажми меня
                        </div>
                      </>
                    )}
                    <div className="absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_15px_hsl(45,100%,58%)]" />
                  </div>
                </div>
                {stage === 'opening' && (
                  <div className="animate-flash pointer-events-none absolute inset-2 z-20 rounded-[1.6rem] bg-white" />
                )}
              </div>
              <div className="pointer-events-none absolute -inset-6 -z-10 animate-spin-slow rounded-full border border-dashed border-secondary/20" />
            </button>
          </div>
        )}

        {/* === ПАНОРАМА === */}
        {stage === 'revealed' && (
          <div className="w-full">
            {/* Бейдж локации */}
            <div className="mb-4 flex flex-col items-center text-center">
              <span className="text-4xl">{loc?.emoji}</span>
              <h2 className="mt-1 font-display text-2xl font-black text-secondary text-glow-cyan md:text-3xl">
                {loc?.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon name="MapPin" size={14} className="text-accent" />
                {loc?.region}
              </p>
            </div>

            {/* Контейнер панорамы */}
            <div
              ref={panoRef}
              className="h-[500px] w-full overflow-hidden rounded-[2rem] border-4 border-primary/40 bg-card door-glow"
            />

            {/* Подсказки */}
            <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="MousePointer2" size={13} className="text-secondary" />
                Зажми и тяни — оглядись
              </span>
              <span className="flex items-center gap-1">
                <Icon name="ArrowRight" size={13} className="text-secondary" />
                Стрелки на земле — иди по улице
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={13} className="text-secondary" />
                Меняй дату в углу панорамы
              </span>
            </div>

            {/* Кнопки */}
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button
                onClick={openDoor}
                className="flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-transform hover:scale-105 active:scale-95"
              >
                <Icon name="DoorOpen" size={18} />
                Другая дверь
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-foreground transition-transform hover:scale-105 active:scale-95"
              >
                <Icon name="RotateCcw" size={18} />
                На главную
              </button>
            </div>
          </div>
        )}

        {/* Карточки фич */}
        {stage === 'closed' && (
          <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: 'Dices',   title: 'Случайно',      text: 'Каждая дверь — сюрприз' },
              { icon: 'Compass', title: 'Только Россия', text: 'От Москвы до Владивостока' },
              { icon: 'Eye',     title: 'Живые панорамы', text: 'Гуляй как на улице' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur transition-colors hover:border-secondary/50">
                <Icon name={f.icon} size={26} className="text-secondary" />
                <h3 className="mt-3 font-display font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
        Russecret · панорамы Яндекс.Карты
      </footer>
    </div>
  );
}
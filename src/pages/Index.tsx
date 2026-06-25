/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Loc {
  name: string;
  region: string;
  coords: [number, number];
  emoji: string;
}

const LOCATIONS: Loc[] = [
  { name: 'Красная площадь', region: 'Москва', coords: [55.7539, 37.6208], emoji: '🏛️' },
  { name: 'Дворцовая площадь', region: 'Санкт-Петербург', coords: [59.9387, 30.3162], emoji: '🌉' },
  { name: 'Озеро Байкал', region: 'Иркутская область', coords: [51.8267, 104.8543], emoji: '🌊' },
  { name: 'Казанский Кремль', region: 'Татарстан', coords: [55.7989, 49.1064], emoji: '🕌' },
  { name: 'Набережная', region: 'Сочи', coords: [43.5855, 39.7231], emoji: '🌴' },
  { name: 'Долина гейзеров', region: 'Камчатка', coords: [54.4337, 160.1411], emoji: '🌋' },
  { name: 'Нижегородский Кремль', region: 'Нижний Новгород', coords: [56.3287, 44.0020], emoji: '🏰' },
  { name: 'Куршская коса', region: 'Калининград', coords: [55.0850, 20.8200], emoji: '🏖️' },
  { name: 'Площадь Минина', region: 'Владивосток', coords: [43.1155, 131.8855], emoji: '🚢' },
  { name: 'Мамаев курган', region: 'Волгоград', coords: [48.7421, 44.5371], emoji: '🗿' },
  { name: 'Кул-Шариф', region: 'Екатеринбург', coords: [56.8389, 60.6057], emoji: '🏙️' },
  { name: 'Старый город', region: 'Псков', coords: [57.8194, 28.3318], emoji: '⛪' },
];

declare global {
  interface Window { ymaps: any }
}

const Index = () => {
  const [stage, setStage] = useState<'closed' | 'opening' | 'revealed'>('closed');
  const [loc, setLoc] = useState<Loc | null>(null);
  const [visited, setVisited] = useState(0);
  const panoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const openDoor = () => {
    const next = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    setLoc(next);
    setStage('opening');
    setVisited((v) => v + 1);
    setTimeout(() => setStage('revealed'), 1100);
  };

  const reset = () => {
    if (playerRef.current) {
      playerRef.current.destroy?.();
      playerRef.current = null;
    }
    setStage('closed');
    setLoc(null);
  };

  useEffect(() => {
    if (stage !== 'revealed' || !loc || !panoRef.current) return;
    const ymaps = window.ymaps;
    if (!ymaps) return;
    ymaps.ready(() => {
      ymaps.panorama
        .locate(loc.coords)
        .then((panoramas: any[]) => {
          if (!panoRef.current) return;
          panoRef.current.innerHTML = '';
          if (panoramas.length > 0) {
            playerRef.current = new ymaps.panorama.Player(panoRef.current, panoramas[0], {
              controls: ['zoomControl'],
            });
          } else {
            renderMapFallback(ymaps, loc);
          }
        })
        .catch(() => renderMapFallback(ymaps, loc));
    });
  }, [stage, loc]);

  const renderMapFallback = (ymaps: any, l: Loc) => {
    if (!panoRef.current) return;
    panoRef.current.innerHTML = '';
    const map = new ymaps.Map(panoRef.current, {
      center: l.coords,
      zoom: 14,
      controls: ['zoomControl'],
    });
    map.geoObjects.add(new ymaps.Placemark(l.coords, { iconCaption: l.name }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-aurora">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-secondary/20 blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2 font-display text-2xl font-black">
          <span className="text-primary text-glow-pink">Rus</span>
          <span className="text-secondary text-glow-cyan -ml-2">secret</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm backdrop-blur">
          <Icon name="MapPin" size={16} className="text-accent" />
          <span className="text-muted-foreground">Локаций открыто:</span>
          <span className="font-display font-bold text-accent">{visited}</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-6 pb-20 md:pt-12">
        {stage !== 'revealed' && (
          <>
            <div className="mb-3 flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-secondary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
              телепорт по России
            </div>
            <h1 className="text-center font-display text-4xl font-black leading-tight md:text-6xl">
              Открой дверь —<br />
              <span className="text-primary text-glow-pink">окажись где угодно</span>
            </h1>
            <p className="mt-5 max-w-xl text-center text-base text-muted-foreground md:text-lg">
              Одно нажатие — и ты в случайной точке России. Прогуляйся по панораме,
              угадай где ты, и открывай дверь снова.
            </p>
          </>
        )}

        {/* Door / Panorama */}
        <div className="relative mt-10 w-full">
          {stage !== 'revealed' ? (
            <div className="flex justify-center">
              <button
                onClick={openDoor}
                disabled={stage === 'opening'}
                className="group relative animate-float"
                aria-label="Открыть секретную дверь"
              >
                {/* Door frame */}
                <div className="door-glow relative h-[420px] w-[260px] rounded-[2rem] border-4 border-accent/70 bg-gradient-to-b from-card to-background p-2 transition-transform duration-300 group-hover:scale-[1.03]">
                  {/* Light behind door */}
                  <div className="absolute inset-2 overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-primary via-secondary to-accent" />
                  {/* The opening leaf */}
                  <div
                    className={`absolute inset-2 origin-left overflow-hidden rounded-[1.6rem] border-2 border-border bg-gradient-to-b from-[#1a1230] to-[#0d0820] ${
                      stage === 'opening' ? 'animate-door-open' : ''
                    }`}
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <div className="text-7xl">🚪</div>
                      <div className="rounded-full border border-accent/50 px-4 py-1 font-display text-xs uppercase tracking-widest text-accent">
                        нажми меня
                      </div>
                      {/* Handle */}
                      <div className="absolute right-6 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_15px_hsl(45,100%,58%)]" />
                    </div>
                  </div>
                  {/* Flash on open */}
                  {stage === 'opening' && (
                    <div className="animate-flash pointer-events-none absolute inset-2 z-20 rounded-[1.6rem] bg-white" />
                  )}
                </div>
                <div className="pointer-events-none absolute -inset-6 -z-10 animate-spin-slow rounded-full border border-dashed border-secondary/20" />
              </button>
            </div>
          ) : (
            <div className="animate-scale-in">
              <div className="mb-5 flex flex-col items-center text-center">
                <span className="text-5xl">{loc?.emoji}</span>
                <h2 className="mt-2 font-display text-3xl font-black text-secondary text-glow-cyan md:text-4xl">
                  {loc?.name}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <Icon name="MapPin" size={16} className="text-accent" />
                  {loc?.region}
                </p>
              </div>
              <div
                ref={panoRef}
                className="h-[440px] w-full overflow-hidden rounded-[2rem] border-4 border-primary/40 bg-card door-glow"
              />
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <button
                  onClick={openDoor}
                  className="flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-105 active:scale-95"
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
        </div>

        {stage === 'closed' && (
          <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: 'Dices', title: 'Случайно', text: 'Каждая дверь — сюрприз' },
              { icon: 'Compass', title: 'Только Россия', text: 'От Москвы до Камчатки' },
              { icon: 'Eye', title: 'Панорамы', text: 'Гуляй как на улице' },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur transition-colors hover:border-secondary/50"
              >
                <Icon name={f.icon} size={26} className="text-secondary" />
                <h3 className="mt-3 font-display font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
        Russecret · панорамы предоставлены Яндекс.Картами
      </footer>
    </div>
  );
};

export default Index;
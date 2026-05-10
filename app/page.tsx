'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';

import { supabase } from '../lib/supabase';

import { availableCountries } from '../lib/countries';

// ==========================================
// 1. CONSTANTES GLOBALES Y CONFIGURACIÓN: MUNDIAL 2026
// ==========================================

const ADMIN_EMAIL = 'admin@mundial2026.com';
const GAME_START_DATE = '2026-06-11T20:00:00'; // Fecha del partido inaugural
const SIMULATED_GAME_START = '2026-06-11T20:00:00';
const MAX_BUDGET = 450;

const LINEUP_MATCHDAYS = ['J1', 'J2', 'J3', 'D16', 'OCT', 'CUA', 'SEM', 'FIN'];

let GLOBAL_ACTIVE_MATCHDAY = 'J1';
const GLOBAL_SCORES: Record<string, Record<string, number | null>> = {};
const GLOBAL_MATCHES: Record<string, string> = {};

const VALID_FORMATIONS = [
  '3-4-3',
  '3-5-2',
  '4-3-3',
  '4-4-2',
  '4-5-1',
  '5-3-2',
  '5-4-1',
];

// ==========================================
// 10. COMPONENTE TUTORIAL (ONBOARDING)
// ==========================================

const TutorialCaddy = ({
  step,
  active,
  onNext,
  onClose,
  userName,
  extrasCount = 0,
  captain, // Importante: pasamos captain para validar el paso 2
}: any) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  if (!active) return null;

  const tutorialSteps = [
    {
      id: 0,
      title: '📖 1. El Reglamento',
      desc: `Bienvenido ${userName}. Comencemos esta guía mostrándote las reglas del juego. En este apartado tienes los detalles que debes conocer antes de jugar. Cuando estés listo para fichar pulsa en "SIGUIENTE".`,
      view: 'rules',
      icon: '📖',
      auto: false,
    },
    {
      id: 1,
      title: '📋 2. Tu 11 Inicial',
      desc: 'Selecciona tus 11 titulares. ¡Este mensaje cambiará solo cuando termines!',
      view: 'squad',
      icon: '⚽',
      auto: true,
    },
    {
      id: 2,
      title: '🎖️ 3. El Capitán',
      desc: '¡Buen 11! Ahora haz click en tu estrella favorita para que sea el CAPITÁN. Busca el círculo con la "C" que parpadea.',
      view: 'squad',
      icon: '⭐',
      auto: true,
    },
    {
      id: 3,
      title: '🔄 4. El Banquillo',
      desc: 'Elige a tus 6 suplentes (S1-S6). Son los que te salvarán la jornada.',
      view: 'squad',
      icon: '🔄',
      auto: true,
    },
    {
      id: 4,
      title: '🏟️ 5. Los Reservas',
      desc:
        extrasCount === 0
          ? 'Los no convocados son opcionales (máx 4). ¿Quieres fichar alguno o cerramos ya la plantilla?'
          : '¿Quieres más suplentes o damos por cerrada la plantilla?',
      view: 'squad',
      icon: '🏢',
      auto: true,
    },
    {
      id: 5,
      title: '🔮 6. La Quiniela',
      desc: 'Haz tus pronósticos de grupos para ganar presupuesto. ¡Casi lo tienes!',
      view: 'quiniela',
      icon: '🏆',
      auto: false,
    },
    {
      id: 6,
      title: '📅 7. El Calendario',
      desc: 'Consulta grupos y resultados. Pulsa siguiente para ver los puntos.',
      view: 'calendar',
      icon: '🗓️',
      auto: false,
    },
    {
      id: 7,
      title: '👕 8. Alineaciones',
      desc: 'Aquí retocas tu táctica de la jornada hasta que empiece el partido.',
      view: 'lineups',
      icon: '👕',
      auto: false,
    },
    {
      id: 8,
      title: '📈 9. Puntos',
      desc: 'Aquí verás tu ranking y evolución. ¡Tour terminado!',
      view: 'scores',
      icon: '📈',
      auto: false,
    },
    {
      id: 9,
      title: '🚀 ¡Hecho!',
      desc: "Busca el botón '?' si me necesitas. ¡A por el Mundial Fantástico 2026!",
      view: 'scores',
      icon: '✅',
      auto: false,
    },
  ];

  const current = tutorialSteps[step] || tutorialSteps[0];

  // Nueva posición: top-24 (justo debajo del header)
  return (
    <div className="fixed top-24 right-4 left-4 z-[100] animate-in slide-in-from-top-5 duration-500 pointer-events-none">
      <div className="max-w-md mx-auto bg-[#0a101f] border-2 border-[#22c55e] rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden pointer-events-auto">
        <div className="flex items-start gap-4">
          <div className="text-3xl bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 animate-pulse">
            {current.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-[#22c55e] font-black uppercase text-[10px] tracking-widest mb-1">
              {current.title}
            </h3>
            <p className="text-white/80 text-[11px] leading-relaxed mb-4">
              {current.desc}
            </p>

            {/* LÓGICA DE BOTONES ESPECIAL PARA EL PASO 4 (RESERVAS) */}
            {step === 4 ? (
              <div className="flex flex-col gap-2">
                {extrasCount === 0 ? (
                  <button
                    onClick={() => onNext('quiniela')}
                    className="w-full py-2.5 bg-yellow-500 text-black font-black uppercase text-[9px] tracking-wider rounded-xl hover:scale-105 transition-transform shadow-lg"
                  >
                    No quiero no convocados
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onNext('quiniela')}
                      className="w-full py-2.5 bg-[#22c55e] text-black font-black uppercase text-[9px] tracking-wider rounded-xl hover:scale-105 transition-transform shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    >
                      ✅ Plantilla Completada
                    </button>
                    <div className="w-full py-2 border border-white/10 text-white/50 text-center font-black uppercase text-[9px] rounded-xl cursor-default">
                      Sigues fichando...
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                {/* BLOQUEO DE CAPITÁN: Validamos si estamos en el paso id:2 (Capitán) */}
                {!current.auto || step === 9 || (step === 2 && captain) ? (
                  <button
                    onClick={() =>
                      step < tutorialSteps.length - 1
                        ? onNext(tutorialSteps[step + 1].view)
                        : onClose(dontShowAgain)
                    }
                    className="px-6 py-2.5 bg-[#22c55e] text-black font-black uppercase text-[9px] rounded-xl hover:scale-105 transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  >
                    {step === 9 ? '¡A JUGAR!' : 'SIGUIENTE'}
                  </button>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-white/20 uppercase animate-pulse italic">
                      {step === 2 && !captain
                        ? '⚓ Debes elegir capitán...'
                        : 'Esperando acción...'}
                    </span>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-3 h-3 accent-[#22c55e]"
                  />
                  <span className="text-[8px] font-bold text-white/30 uppercase">
                    No mostrar más
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. GRUPOS DEL MUNDIAL 2026
// ==========================================

const WORLD_CUP_GROUPS_DATA = [
  {
    name: 'GRUPO A',
    teams: ['México', 'Sudáfrica', 'Rep. de Corea', 'Chequia'],
  },
  { name: 'GRUPO B', teams: ['Canadá', 'Bosnia/Herzeg.', 'Qatar', 'Suiza'] },
  { name: 'GRUPO C', teams: ['Brasil', 'Marruecos', 'Haiti', 'Escocia'] },
  { name: 'GRUPO D', teams: ['EE.UU.', 'Paraguay', 'Australia', 'Turquía'] },
  {
    name: 'GRUPO E',
    teams: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  },
  { name: 'GRUPO F', teams: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  { name: 'GRUPO G', teams: ['Bélgica', 'Egipto', 'IR Irán', 'Nueva Zelanda'] },
  {
    name: 'GRUPO H',
    teams: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
  },
  { name: 'GRUPO I', teams: ['Francia', 'Senegal', 'Iraq', 'Noruega'] },
  { name: 'GRUPO J', teams: ['Argentina', 'Argelia', 'Austria', 'Jordán'] },
  {
    name: 'GRUPO K',
    teams: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  },
  { name: 'GRUPO L', teams: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
];

const generateFixture = () => {
  return WORLD_CUP_GROUPS_DATA.map((g) => ({
    n: g.name,
    m: [
      { t1: g.teams[0], t2: g.teams[1], d: 'J1' },
      { t1: g.teams[2], t2: g.teams[3], d: 'J1' },
      { t1: g.teams[0], t2: g.teams[2], d: 'J2' },
      { t1: g.teams[1], t2: g.teams[3], d: 'J2' },
      { t1: g.teams[0], t2: g.teams[3], d: 'J3' },
      { t1: g.teams[1], t2: g.teams[2], d: 'J3' },
    ],
  }));
};

// ==========================================
// 3. BASE DE DATOS DE JUGADORES (TEST DE MERCADO)
// ==========================================

export interface Player {
  id: string;
  nombre: string;
  posicion: 'POR' | 'DEF' | 'MED' | 'DEL';
  precio: number;
  seleccion: string;
}

const PLAYERS_DB = [
  // ESTRELLAS (Muy caros)
  {
    id: '1',
    nombre: 'Kylian Mbappé',
    seleccion: 'Francia',
    posicion: 'DEL',
    precio: 50,
    puntos: 0,
  },
  {
    id: '2',
    nombre: 'Jude Bellingham',
    seleccion: 'Inglaterra',
    posicion: 'MED',
    precio: 45,
    puntos: 0,
  },
  {
    id: '3',
    nombre: 'Rodri',
    seleccion: 'España',
    posicion: 'MED',
    precio: 42,
    puntos: 0,
  },
  {
    id: '4',
    nombre: 'Harry Kane',
    seleccion: 'Inglaterra',
    posicion: 'DEL',
    precio: 45,
    puntos: 0,
  },
  {
    id: '32',
    nombre: 'Jamal Musiala',
    seleccion: 'Alemania',
    posicion: 'MED',
    precio: 40,
    puntos: 0,
  },

  // TITULARES BUENOS (20M - 30M)
  {
    id: '5',
    nombre: 'Rüdiger',
    seleccion: 'Alemania',
    posicion: 'DEF',
    precio: 28,
    puntos: 0,
  },
  {
    id: '11',
    nombre: 'Lamine Yamal',
    seleccion: 'España',
    posicion: 'DEL',
    precio: 25,
    puntos: 0,
  },
  {
    id: '12',
    nombre: 'Nico Williams',
    seleccion: 'España',
    posicion: 'DEL',
    precio: 24,
    puntos: 0,
  },
  {
    id: '18',
    nombre: 'Bukayo Saka',
    seleccion: 'Inglaterra',
    posicion: 'DEL',
    precio: 30,
    puntos: 0,
  },
  {
    id: '24',
    nombre: 'Tchouaméni',
    seleccion: 'Francia',
    posicion: 'MED',
    precio: 25,
    puntos: 0,
  },
  {
    id: '26',
    nombre: 'Griezmann',
    seleccion: 'Francia',
    posicion: 'DEL',
    precio: 30,
    puntos: 0,
  },
  {
    id: '29',
    nombre: 'Kimmich',
    seleccion: 'Alemania',
    posicion: 'DEF',
    precio: 25,
    puntos: 0,
  },
  {
    id: '16',
    nombre: 'Kyle Walker',
    seleccion: 'Inglaterra',
    posicion: 'DEF',
    precio: 22,
    puntos: 0,
  },
  {
    id: '7',
    nombre: 'Carvajal',
    seleccion: 'España',
    posicion: 'DEF',
    precio: 22,
    puntos: 0,
  },

  // CLASE MEDIA (15M - 19M)
  {
    id: '6',
    nombre: 'Unai Simón',
    seleccion: 'España',
    posicion: 'POR',
    precio: 18,
    puntos: 0,
  },
  {
    id: '14',
    nombre: 'Pickford',
    seleccion: 'Inglaterra',
    posicion: 'POR',
    precio: 18,
    puntos: 0,
  },
  {
    id: '20',
    nombre: 'Maignan',
    seleccion: 'Francia',
    posicion: 'POR',
    precio: 19,
    puntos: 0,
  },
  {
    id: '27',
    nombre: 'Neuer',
    seleccion: 'Alemania',
    posicion: 'POR',
    precio: 17,
    puntos: 0,
  },
  {
    id: '10',
    nombre: 'Fabián Ruiz',
    seleccion: 'España',
    posicion: 'MED',
    precio: 18,
    puntos: 0,
  },
  {
    id: '13',
    nombre: 'Morata',
    seleccion: 'España',
    posicion: 'DEL',
    precio: 18,
    puntos: 0,
  },
  {
    id: '25',
    nombre: 'Kanté',
    seleccion: 'Francia',
    posicion: 'MED',
    precio: 16,
    puntos: 0,
  },
  {
    id: '8',
    nombre: 'Le Normand',
    seleccion: 'España',
    posicion: 'DEF',
    precio: 16,
    puntos: 0,
  },
  {
    id: '9',
    nombre: 'Cucurella',
    seleccion: 'España',
    posicion: 'DEF',
    precio: 15,
    puntos: 0,
  },
  {
    id: '28',
    nombre: 'Tah',
    seleccion: 'Alemania',
    posicion: 'DEF',
    precio: 15,
    puntos: 0,
  },

  // GANGAS PARA EL BANQUILLO (8M - 14M)
  {
    id: '35',
    nombre: 'Joselu',
    seleccion: 'España',
    posicion: 'DEL',
    precio: 10,
    puntos: 0,
  },
  {
    id: '36',
    nombre: 'Zubimendi',
    seleccion: 'España',
    posicion: 'MED',
    precio: 12,
    puntos: 0,
  },
  {
    id: '37',
    nombre: 'David Raya',
    seleccion: 'España',
    posicion: 'POR',
    precio: 8,
    puntos: 0,
  },
  {
    id: '38',
    nombre: 'Giroud',
    seleccion: 'Francia',
    posicion: 'DEL',
    precio: 12,
    puntos: 0,
  },
  {
    id: '39',
    nombre: 'Füllkrug',
    seleccion: 'Alemania',
    posicion: 'DEL',
    precio: 10,
    puntos: 0,
  },
  {
    id: '40',
    nombre: 'Mainoo',
    seleccion: 'Inglaterra',
    posicion: 'MED',
    precio: 10,
    puntos: 0,
  },
  {
    id: '41',
    nombre: 'Guehi',
    seleccion: 'Inglaterra',
    posicion: 'DEF',
    precio: 12,
    puntos: 0,
  },
  {
    id: '42',
    nombre: 'Clauss',
    seleccion: 'Francia',
    posicion: 'DEF',
    precio: 11,
    puntos: 0,
  },
  {
    id: '43',
    nombre: 'Anton',
    seleccion: 'Alemania',
    posicion: 'DEF',
    precio: 9,
    puntos: 0,
  },
  {
    id: '44',
    nombre: 'Baumann',
    seleccion: 'Alemania',
    posicion: 'POR',
    precio: 8,
    puntos: 0,
  },
];

const posColors: Record<string, string> = {
  POR: 'bg-[#facc15] text-black',
  DEF: 'bg-[#3b82f6] text-white',
  MED: 'bg-[#10b981] text-white',
  DEL: 'bg-[#ef4444] text-white',
};

// ==========================================
// 4. MOTOR DE BANDERAS (MUNDIAL 2026 - 48 EQUIPOS)
// ==========================================

const getFlag = (team: string) => {
  const flags: Record<string, string> = {
    // Grupo A
    México: 'mx',
    Sudáfrica: 'za',
    'Rep. de Corea': 'kr',
    Chequia: 'cz',
    // Grupo B
    Canadá: 'ca',
    'Bosnia/Herzeg.': 'ba',
    Qatar: 'qa',
    Suiza: 'ch',
    // Grupo C
    Brasil: 'br',
    Marruecos: 'ma',
    Haiti: 'ht',
    Escocia: 'gb-sct',
    // Grupo D
    'EE.UU.': 'us',
    Paraguay: 'py',
    Australia: 'au',
    Turquía: 'tr',
    // Grupo E
    Alemania: 'de',
    Curazao: 'cw',
    'Costa de Marfil': 'ci',
    Ecuador: 'ec',
    // Grupo F
    'Países Bajos': 'nl',
    Japón: 'jp',
    Suecia: 'se',
    Túnez: 'tn',
    // Grupo G
    Bélgica: 'be',
    Egipto: 'eg',
    'IR Irán': 'ir',
    'Nueva Zelanda': 'nz',
    // Grupo H
    España: 'es',
    'Cabo Verde': 'cv',
    'Arabia Saudita': 'sa',
    Uruguay: 'uy',
    // Grupo I
    Francia: 'fr',
    Senegal: 'sn',
    Iraq: 'iq',
    Noruega: 'no',
    // Grupo J
    Argentina: 'ar',
    Argelia: 'dz',
    Austria: 'at',
    Jordán: 'jo',
    // Grupo K
    Portugal: 'pt',
    'RD Congo': 'cd',
    Uzbekistán: 'uz',
    Colombia: 'co',
    // Grupo L
    Inglaterra: 'gb-eng',
    Croacia: 'hr',
    Ghana: 'gh',
    Panamá: 'pa',
  };

  const code = flags[team];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
};

// Componente visual para mostrar el precio del jugador
const PlayerValueBadge = ({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) => (
  <div
    className={`flex items-center justify-center bg-black/80 text-[#22c55e] px-1.5 py-0.5 rounded border border-[#22c55e]/30 shadow-lg ${className}`}
  >
    <span className="text-[8px] font-black tracking-tighter">{value}M</span>
  </div>
);

// ==========================================
// 5. MOTOR DE CLASIFICACIÓN Y MEJORES TERCEROS
// ==========================================

const getTournamentStandings = () => {
  const standings: Record<string, any[]> = {};
  let allThirds: any[] = [];
  const advancedTeams = new Set<string>();

  WORLD_CUP_GROUPS_DATA.forEach((g) => {
    let teams = g.teams.map((t) => ({
      name: t,
      pts: 0,
      gf: 0,
      gc: 0,
      gd: 0,
      played: 0,
      w: 0,
      d: 0,
      l: 0,
    }));
    const groupMatches = generateFixture().find((x) => x.n === g.name)?.m || [];

    groupMatches.forEach((m) => {
      const matchId = `${m.t1}-${m.t2}`;
      const res = GLOBAL_MATCHES[matchId];
      if (res && res.includes('-')) {
        const [g1, g2] = res.split('-').map((x: string) => parseInt(x.trim()));
        const t1 = teams.find((x: any) => x.name === m.t1);
        const t2 = teams.find((x: any) => x.name === m.t2);
        if (t1 && t2 && !isNaN(g1) && !isNaN(g2)) {
          t1.played++;
          t2.played++;
          t1.gf += g1;
          t1.gc += g2;
          t1.gd = t1.gf - t1.gc;
          t2.gf += g2;
          t2.gc += g1;
          t2.gd = t2.gf - t2.gc;
          if (g1 > g2) {
            t1.pts += 3;
            t1.w++;
            t2.l++;
          } else if (g1 < g2) {
            t2.pts += 3;
            t2.w++;
            t1.l++;
          } else {
            t1.pts += 1;
            t2.pts += 1;
            t1.d++;
            t2.d++;
          }
        }
      }
    });

    teams.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });

    standings[g.name] = teams;

    if (teams[0]) advancedTeams.add(teams[0].name);
    if (teams[1]) advancedTeams.add(teams[1].name);

    // Recogemos los terceros de los 12 grupos
    if (teams[2])
      allThirds.push({ ...teams[2], group: g.name.replace('GRUPO ', '') });
  });

  // Ordenamos a todos los terceros
  allThirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  // Nos quedamos solo con los 8 mejores
  const bestThirds = allThirds.slice(0, 8);
  bestThirds.forEach((t) => advancedTeams.add(t.name));

  return { standings, advancedTeams, bestThirds };
};

// ==========================================
// 6. MOTOR INTELIGENTE DE CRUCES Y BACKTRACKING (DIECISEISAVOS)
// ==========================================

const resolveMatchWinner = (t1: string, t2: string) => {
  if (!t1 || !t2 || t1 === '???' || t2 === '???') return null;
  const res1 = GLOBAL_MATCHES[`${t1}-${t2}`];
  const res2 = GLOBAL_MATCHES[`${t2}-${t1}`];
  const res = res1 || res2;
  if (!res) return null;

  const [g1, g2] = res.split('-').map(Number);
  if (g1 > g2) return res1 ? t1 : t2;
  if (g2 > g1) return res1 ? t2 : t1;

  const penWinner1 = GLOBAL_MATCHES[`${t1}-${t2}_PEN`];
  const penWinner2 = GLOBAL_MATCHES[`${t2}-${t1}_PEN`];
  if (penWinner1) return penWinner1;
  if (penWinner2) return penWinner2;

  return t1;
};

// Algoritmo para cuadrar a los 8 mejores terceros sin repetir grupos
const assignThirdsToTargets = (bestThirds: any[]) => {
  const targets = [
    { id: '1E', valid: ['A', 'B', 'C', 'D', 'F'] },
    { id: '1I', valid: ['C', 'D', 'F', 'G', 'H'] },
    { id: '1A', valid: ['C', 'E', 'F', 'H', 'I'] },
    { id: '1L', valid: ['E', 'H', 'I', 'J', 'K'] },
    { id: '1D', valid: ['B', 'E', 'F', 'I', 'J'] },
    { id: '1G', valid: ['A', 'E', 'H', 'I', 'J'] },
    { id: '1B', valid: ['E', 'F', 'G', 'I', 'J'] },
    { id: '1K', valid: ['D', 'E', 'I', 'J', 'L'] },
  ];

  let finalAssignment: Record<string, string> = {};

  const backtrack = (
    index: number,
    currentAssignment: Record<string, string>,
    usedThirds: Set<string>
  ): boolean => {
    if (index === targets.length) {
      finalAssignment = { ...currentAssignment };
      return true;
    }

    const target = targets[index];
    for (let i = 0; i < bestThirds.length; i++) {
      const third = bestThirds[i];
      if (!usedThirds.has(third.group) && target.valid.includes(third.group)) {
        currentAssignment[target.id] = third.name;
        usedThirds.add(third.group);
        if (backtrack(index + 1, currentAssignment, usedThirds)) return true;
        usedThirds.delete(third.group);
        delete currentAssignment[target.id];
      }
    }
    return false;
  };

  if (bestThirds.length === 8) backtrack(0, {}, new Set());
  return finalAssignment;
};

const getKnockoutFixtures = () => {
  const { standings, bestThirds } = getTournamentStandings();

  const getTeam = (
    posCode: string,
    assignments: Record<string, string> = {}
  ) => {
    if (!posCode) return { name: '???', isKnown: false };

    if (assignments[posCode])
      return { name: assignments[posCode], isKnown: true };

    if (posCode.length === 2) {
      const rank = parseInt(posCode.charAt(0)) - 1;
      const group = posCode.charAt(1);
      const team = standings[`GRUPO ${group}`]?.[rank];
      return team
        ? { name: team.name, isKnown: true }
        : { name: posCode, isKnown: false };
    }
    return { name: posCode, isKnown: false };
  };

  const thirdAssignments = assignThirdsToTargets(bestThirds);

  // Los 16 partidos oficiales de Dieciseisavos (D16)
  const D1 = { id: 'D1', t1: getTeam('2A'), t2: getTeam('2B') };
  const D2 = {
    id: 'D2',
    t1: getTeam('1E'),
    t2: getTeam('1E', thirdAssignments),
  };
  const D3 = { id: 'D3', t1: getTeam('1F'), t2: getTeam('2C') };
  const D4 = { id: 'D4', t1: getTeam('1C'), t2: getTeam('2F') };
  const D5 = {
    id: 'D5',
    t1: getTeam('1I'),
    t2: getTeam('1I', thirdAssignments),
  };
  const D6 = { id: 'D6', t1: getTeam('2E'), t2: getTeam('2I') };
  const D7 = {
    id: 'D7',
    t1: getTeam('1A'),
    t2: getTeam('1A', thirdAssignments),
  };
  const D8 = {
    id: 'D8',
    t1: getTeam('1L'),
    t2: getTeam('1L', thirdAssignments),
  };
  const D9 = {
    id: 'D9',
    t1: getTeam('1D'),
    t2: getTeam('1D', thirdAssignments),
  };
  const D10 = {
    id: 'D10',
    t1: getTeam('1G'),
    t2: getTeam('1G', thirdAssignments),
  };
  const D11 = { id: 'D11', t1: getTeam('2K'), t2: getTeam('2L') };
  const D12 = { id: 'D12', t1: getTeam('1H'), t2: getTeam('2J') };
  const D13 = {
    id: 'D13',
    t1: getTeam('1B'),
    t2: getTeam('1B', thirdAssignments),
  };
  const D14 = { id: 'D14', t1: getTeam('1J'), t2: getTeam('2H') };
  const D15 = {
    id: 'D15',
    t1: getTeam('1K'),
    t2: getTeam('1K', thirdAssignments),
  };
  const D16 = { id: 'D16', t1: getTeam('2D'), t2: getTeam('2G') };

  const getW = (match: any) => {
    if (!match.t1.isKnown || !match.t2.isKnown)
      return { name: '???', isKnown: false };
    const winnerName = resolveMatchWinner(match.t1.name, match.t2.name);
    return winnerName
      ? { name: winnerName, isKnown: true }
      : { name: '???', isKnown: false };
  };

  // Octavos (Agrupados en bloques de 2 según llave oficial)
  const O1 = { id: 'O1', t1: getW(D1), t2: getW(D2) };
  const O2 = { id: 'O2', t1: getW(D3), t2: getW(D4) };
  const O3 = { id: 'O3', t1: getW(D5), t2: getW(D6) };
  const O4 = { id: 'O4', t1: getW(D7), t2: getW(D8) };
  const O5 = { id: 'O5', t1: getW(D9), t2: getW(D10) };
  const O6 = { id: 'O6', t1: getW(D11), t2: getW(D12) };
  const O7 = { id: 'O7', t1: getW(D13), t2: getW(D14) };
  const O8 = { id: 'O8', t1: getW(D15), t2: getW(D16) };

  const C1 = { id: 'C1', t1: getW(O1), t2: getW(O2) };
  const C2 = { id: 'C2', t1: getW(O3), t2: getW(O4) };
  const C3 = { id: 'C3', t1: getW(O5), t2: getW(O6) };
  const C4 = { id: 'C4', t1: getW(O7), t2: getW(O8) };

  const S1 = { id: 'S1', t1: getW(C1), t2: getW(C2) };
  const S2 = { id: 'S2', t1: getW(C3), t2: getW(C4) };

  const F = { id: 'F', t1: getW(S1), t2: getW(S2) };

  return {
    dieciseisavos: [
      D1,
      D2,
      D3,
      D4,
      D5,
      D6,
      D7,
      D8,
      D9,
      D10,
      D11,
      D12,
      D13,
      D14,
      D15,
      D16,
    ],
    octavos: [O1, O2, O3, O4, O5, O6, O7, O8],
    cuartos: [C1, C2, C3, C4],
    semis: [S1, S2],
    final: [F],
  };
};

// ==========================================
// 8. CAMPO DE FÚTBOL VISUAL
// ==========================================

const IconPlus = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const IconCheck = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const Field = ({
  selected,
  step,
  canInteractField,
  activeSlot,
  setActiveSlot,
  captain,
  setCaptain,
  renderPointsBadge,
}: any) => {
  return (
    <div className="mt-6 relative w-full aspect-[4/5] bg-gradient-to-b from-green-600 to-green-700 rounded-[2.5rem] border-[4px] border-white/20 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')]"></div>
      <div className="absolute inset-0 border-2 border-white/40 m-4 rounded-lg pointer-events-none"></div>
      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/40 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute top-4 left-1/2 w-48 h-24 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-lg pointer-events-none"></div>
      <div className="absolute top-4 left-1/2 w-20 h-10 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-lg pointer-events-none"></div>
      <div className="absolute top-28 left-1/2 w-20 h-10 border-2 border-t-0 border-white/40 -translate-x-1/2 rounded-b-full pointer-events-none"></div>
      <div className="absolute bottom-4 left-1/2 w-48 h-24 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-lg pointer-events-none"></div>
      <div className="absolute bottom-4 left-1/2 w-20 h-10 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-lg pointer-events-none"></div>
      <div className="absolute bottom-28 left-1/2 w-20 h-10 border-2 border-b-0 border-white/40 -translate-x-1/2 rounded-t-full pointer-events-none"></div>

      <div className="absolute top-[8%] left-0 -translate-y-1/2 bg-[#ef4444] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">
        DEL
      </div>
      <div className="absolute top-[33%] left-0 -translate-y-1/2 bg-[#10b981] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">
        MED
      </div>
      <div className="absolute top-[58%] left-0 -translate-y-1/2 bg-[#3b82f6] py-1.5 px-3 rounded-r-lg shadow-xl text-white text-[10px] font-black italic z-20 border-r border-y border-white/20">
        DEF
      </div>
      <div className="absolute top-[88%] left-0 -translate-y-1/2 bg-[#facc15] py-1.5 px-3 rounded-r-lg shadow-xl text-black text-[10px] font-black italic z-20 border-r border-y border-white/20">
        POR
      </div>

      {[
        { pos: 'DEL', top: '20%', slots: [1, 2, 3] },
        { pos: 'MED', top: '45%', slots: [1, 2, 3, 4, 5] },
        { pos: 'DEF', top: '70%', slots: [1, 2, 3, 4, 5] },
        { pos: 'POR', top: '90%', slots: [1] },
      ].map((row) => (
        <div
          key={row.pos}
          className={`absolute w-full -translate-y-1/2 flex justify-${
            row.slots.length === 1 ? 'center' : 'between'
          } gap-1 px-6 z-30`}
          style={{ top: row.top }}
        >
          {row.slots.map((i) => {
            const id = `${row.pos}-${i}`;
            const p = selected[id];

            // LÓGICA DE ILUMINACIÓN FIJA
            const isActive =
              activeSlot?.id === id && activeSlot?.type === 'titular';
            const bgClass = p
              ? 'bg-white border-[#22c55e]'
              : 'bg-black/40 border-white/20';

            const highlightClass = isActive
              ? 'bg-white/30 border-white ring-4 ring-white/60 scale-110' // Estado seleccionado fijo
              : canInteractField && !p
              ? 'hover:bg-white/20 hover:border-white ring-4 ring-transparent hover:ring-white/30'
              : ''; // Solo hover si no está seleccionado

            return (
              <div
                key={i}
                className="relative flex flex-col items-center group cursor-pointer"
                onClick={() =>
                  canInteractField &&
                  setActiveSlot({ id, type: 'titular', pos: row.pos })
                }
              >
                <div
                  className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all relative z-30 ${bgClass} ${highlightClass}`}
                >
                  {p ? (
                    <span
                      className={`text-[9px] font-black text-black text-center leading-none uppercase italic`}
                    >
                      {p.nombre.split(' ').pop()}
                    </span>
                  ) : (
                    <div className="text-white/50">
                      <IconPlus />
                    </div>
                  )}

                  {p && step >= 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canInteractField) setCaptain(p.id);
                      }}
                      className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 font-black text-[9px] flex items-center justify-center transition-all z-50 ${
                        captain === p.id
                          ? 'bg-[#facc15] text-black border-white scale-110 shadow-lg'
                          : 'bg-black/60 text-white/30 border-white/10 hover:bg-black/80 hover:text-white'
                      }`}
                    >
                      {captain === p.id ? <IconCheck /> : 'C'}
                    </button>
                  )}

                  {p && renderPointsBadge && renderPointsBadge(p, true)}
                  {p && (
                    <PlayerValueBadge
                      value={p.precio}
                      className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-40"
                    />
                  )}
                </div>

                {p && (
                  <img
                    src={getFlag(p.seleccion)}
                    alt={p.seleccion}
                    className="mt-1 w-8 h-6 object-cover rounded shadow-black drop-shadow-lg z-20"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 6. REGLAS Y PUNTUACIONES
// ==========================================

const RuleCard = ({ color, title, icon, children }: any) => (
  <div className="bg-[#1c2a45] rounded-2xl border border-white/5 overflow-hidden mb-6 shadow-xl">
    <div
      className="p-4 flex items-center justify-between"
      style={{ borderLeft: `6px solid ${color}` }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="font-black italic uppercase text-lg tracking-wide text-white">
          {title}
        </h3>
      </div>
    </div>
    <div className="p-5 border-t border-white/5 bg-[#0d1526]/50 text-sm text-gray-100 leading-relaxed text-left">
      {children}
    </div>
  </div>
);

const ScoreRow = ({ label, pts, color = 'text-white' }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
    <span className="text-gray-200 font-medium text-xs uppercase">{label}</span>
    <span className={`font-black text-sm ${color}`}>{pts}</span>
  </div>
);

const FixedRulesView = () => {
  return (
    <div className="pb-32 animate-in fade-in duration-500">
      <div className="relative h-72 w-full mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-[#05080f]/50 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080f] via-[#05080f]/20 to-transparent z-10"></div>
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1624280433509-b4dca387790d?q=80&w=2070&auto=format&fit=crop')",
            }}
          ></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-8 z-20">
          <h1 className="text-4xl font-black italic text-[#22c55e] uppercase tracking-tighter mb-2 flex items-center gap-3 drop-shadow-lg">
            <span className="text-3xl">📄</span> REGLAMENTO
          </h1>
          <p className="text-white text-sm font-bold tracking-widest max-w-lg leading-relaxed drop-shadow-md">
            Bienvenido a la guía oficial. Aquí encontrarás todo lo necesario
            para dominar el juego.
          </p>
        </div>
      </div>
      <div className="max-w-xl mx-auto px-4">
        <RuleCard
          color="#22c55e"
          title="1. Plantilla Inicial"
          icon={<span className="text-2xl">👥</span>}
        >
          {/* Texto introductorio mantenido */}
          <p className="mb-4 text-base leading-relaxed">
            Crea tu plantilla inicial compuesta por un máximo de{' '}
            <strong>21 jugadores</strong> distribuidos de la siguiente manera:{' '}
            <strong>11 Titulares, 6 suplentes</strong> y el resto esperarán su
            oportunidad desde la grada.
          </p>

          <div className="space-y-3">
            {/* NOVEDAD: Presupuesto inicial con bolsa de dinero */}
            <div className="flex items-center gap-3 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <span className="text-2xl">💰</span>
              <p className="text-sm">
                El presupuesto inicial de{' '}
                <strong className="text-yellow-400 text-lg">450M</strong>{' '}
                aumentará con los premios de la{' '}
                <strong className="text-[#22c55e] uppercase">
                  QUINIELA MUNDIAL
                </strong>
                .
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
              {/* Capitán */}
              <div className="flex items-center gap-3">
                <span className="text-xl">⭐</span>
                <p className="text-sm">
                  <strong className="text-[#facc15] uppercase">Capitán:</strong>{' '}
                  Puntúa DOBLE (positivo o negativo).
                </p>
              </div>

              {/* Penalización */}
              <div className="flex items-center gap-3">
                <span className="text-red-400 text-lg">⚠️</span>
                <p className="text-sm">
                  <strong className="text-red-400 uppercase">
                    Penalización:
                  </strong>{' '}
                  Cada hueco vacío en el 11 resta <strong>-1 punto</strong>.
                </p>
              </div>

              {/* Suplentes */}
              <div className="flex items-center gap-3">
                <span className="text-blue-400 text-xl">🔄</span>
                <p className="text-sm">
                  <strong className="text-blue-400 uppercase">
                    Suplentes:
                  </strong>{' '}
                  Entran automático por orden (S1→S6) si un titular no juega.
                </p>
              </div>

              {/* Límite de selección con BOLA DEL MUNDO */}
              <div className="flex items-center gap-3 bg-blue-900/20 p-2 rounded border border-blue-500/30">
                <span className="text-xl">🌍</span>
                <p className="text-sm text-blue-200 font-bold">
                  En la primera fase el límite de jugadores de la misma
                  selección es 7.
                </p>
              </div>
            </div>
          </div>
        </RuleCard>

        <RuleCard
          color="#3b82f6"
          title="2. Tácticas Válidas"
          icon={<span className="text-2xl">🛡️</span>}
        >
          <p className="mb-4 text-xs uppercase font-bold text-white/50">
            Esquemas permitidos:
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono font-bold text-center">
            {['1-5-3-2', '1-4-4-2', '1-4-5-1', '1-4-3-3', '1-3-4-3'].map(
              (t) => (
                <div
                  key={t}
                  className="bg-[#22c55e]/10 p-3 rounded-lg border border-[#22c55e] text-[#22c55e] h-12 flex items-center justify-center"
                >
                  {t}
                </div>
              )
            )}
            <div className="bg-[#22c55e]/10 p-3 rounded-lg border border-red-500 text-[#22c55e] h-12 flex items-center justify-center gap-2">
              <span>1-3-5-2</span>
              <span className="bg-red-600 text-white text-[7px] px-1.5 py-0.5 rounded font-black animate-pulse">
                NOVEDAD
              </span>
            </div>
          </div>
        </RuleCard>

        <RuleCard
          color="#ec4899"
          title="3. Mercado de Fichajes"
          icon={<span className="text-2xl">💱</span>}
        >
          <div className="flex items-center gap-2 mb-4">
            <p className="font-bold text-white text-base text-balance">
              2 Ventanas de mercado:
            </p>
            <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded font-black animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              NOVEDAD
            </span>
          </div>

          <div className="space-y-4 mb-6">
            {/* Ventana 1 */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-red-500 uppercase italic">
                🚀 VENTANA 1:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-blue-900/40 border border-blue-500/50 p-2 rounded-lg text-center text-[9px] font-bold uppercase">
                  Fase Grupos
                </div>
                <span className="text-white/30">⟷</span>
                <div className="flex-1 bg-purple-900/40 border border-purple-500/50 p-2 rounded-lg text-center text-[9px] font-bold uppercase text-purple-200">
                  16avos
                </div>
              </div>
            </div>

            {/* Ventana 2 */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-red-500 uppercase italic">
                🔥 VENTANA 2:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-amber-900/40 border border-amber-500/50 p-2 rounded-lg text-center text-[9px] font-bold uppercase text-amber-100">
                  Octavos
                </div>
                <span className="text-white/30">⟷</span>
                <div className="flex-1 bg-red-900/40 border border-red-500/50 p-2 rounded-lg text-center text-[9px] font-bold uppercase text-red-100">
                  Cuartos
                </div>
              </div>
            </div>
          </div>

          <ul className="space-y-2 text-[11px] text-gray-200">
            <li className="flex items-center gap-3 bg-white/5 p-2 rounded">
              <span className="text-[#22c55e]">✔️</span>
              <span>
                Máximo <strong>6 cambios</strong> por ventana.
              </span>
            </li>
            <li className="flex items-center gap-3 bg-white/5 p-2 rounded">
              <span className="text-[#22c55e]">✔️</span>
              <span>
                Límite: <strong>8 jugadores/país</strong>.
              </span>
            </li>
            <li className="flex flex-col gap-1 bg-[#22c55e]/5 p-3 rounded border border-[#22c55e]/30">
              <div className="flex items-center gap-2">
                <span className="text-[#22c55e]">✔️</span>
                <span>
                  Presupuesto inicial de <strong>450M</strong> aumentará con los
                  premios de la:
                </span>
              </div>
              <span className="text-[#22c55e] font-black uppercase text-center text-sm tracking-widest mt-1">
                QUINIELA MUNDIAL
              </span>
            </li>
          </ul>
        </RuleCard>

        <RuleCard
          color="#facc15"
          title="4. Puntuaciones"
          icon={<span className="text-2xl">📋</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h4 className="text-[#22c55e] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">
                Acción Ofensiva
              </h4>
              <ScoreRow
                label="⚽ Gol (Cualquiera)"
                pts="+5"
                color="text-[#22c55e]"
              />
              <ScoreRow label="👟 Asistencia" pts="+1" color="text-[#22c55e]" />
              <ScoreRow
                label={
                  <div className="flex items-center gap-2">
                    🥅 ✅ <span>Penalti Marcado</span>
                  </div>
                }
                pts="+5"
                color="text-[#22c55e]"
              />
              <ScoreRow
                label={
                  <div className="flex items-center gap-2">
                    🥅 ❌ <span>Penalti Fallado</span>
                  </div>
                }
                pts="-3"
                color="text-red-500"
              />
              <ScoreRow
                label="📉 Gol Propia Meta"
                pts="-1"
                color="text-red-500"
              />
            </div>
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <h4 className="text-[#facc15] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">
                  Portero (POR)
                </h4>
                <ScoreRow
                  label={
                    <div className="flex items-center gap-2">
                      🥅 ⛔ <span>Penalti Parado</span>
                    </div>
                  }
                  pts="+3"
                  color="text-[#22c55e]"
                />
                <ScoreRow
                  label={
                    <div className="flex items-center gap-2">
                      🥅 🧤 <span>Portería a 0 (+60&apos;)</span>
                    </div>
                  }
                  pts="+4"
                  color="text-[#22c55e]"
                />
                <div className="pt-2 border-t border-white/5 mt-2">
                  <ScoreRow
                    label={
                      <div className="flex items-center gap-1">
                        🥅 ⚽ <span>1 Gol Encajado</span>
                      </div>
                    }
                    pts="0"
                    color="text-gray-400"
                  />
                  <ScoreRow
                    label={
                      <div className="flex items-center gap-1">
                        🥅 ⚽⚽ / + <span>2 Goles Enc.</span>
                      </div>
                    }
                    pts="-2 / -3..."
                    color="text-red-400"
                  />
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <h4 className="text-[#3b82f6] font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">
                  Defensa (DEF)
                </h4>
                <ScoreRow
                  label="🛡️ Portería a 0 (+45')"
                  pts="+2"
                  color="text-[#22c55e]"
                />
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 mt-6">
            <h4 className="text-white/60 font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">
              Partido y Resultado
            </h4>
            <div className="flex justify-between items-center py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded transition-colors">
              <span className="text-gray-200 font-medium text-xs uppercase flex items-center gap-2">
                👟 ⚽ Jugar Partido
              </span>
              <span className="font-black text-sm text-[#22c55e]">+1</span>
            </div>
            <ScoreRow label="👕 Ser Titular" pts="+1" color="text-[#22c55e]" />
            <ScoreRow
              label="✅ Victoria Equipo"
              pts="+1"
              color="text-[#22c55e]"
            />
            <ScoreRow label="❌ Derrota Equipo" pts="-1" color="text-red-500" />
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 mt-6">
            <h4 className="text-red-400 font-black uppercase text-xs tracking-widest mb-3 border-b border-white/10 pb-2">
              Sanciones
            </h4>
            <div className="flex justify-between items-center py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded transition-colors">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-400 w-3 h-4 rounded-sm rotate-12 inline-block"></span>
                <span className="text-gray-200 font-medium text-xs uppercase">
                  Doble Amarilla
                </span>
              </div>
              <span className="font-black text-sm text-red-500">-3</span>
            </div>
            <ScoreRow label="🟥 Roja Directa" pts="-5" color="text-red-500" />
          </div>
        </RuleCard>

        <RuleCard
          color="#a855f7"
          title="5. Valoraciones Sofascore"
          icon={<span className="text-2xl">📊</span>}
        >
          <p className="mb-4 text-left text-gray-300 text-sm">
            Puntos extra basados en la nota del jugador en la App{' '}
            <span className="text-blue-400 font-black uppercase">
              SOFASCORE
            </span>
          </p>
          <div className="grid grid-cols-2 gap-4 text-center text-xs">
            <div className="space-y-3">
              <div className="bg-[#1e4620] p-3 rounded-lg border border-[#22c55e]/30 shadow-lg">
                <div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">
                  Excelente
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>9.5 - 10</span>
                  <b className="text-[#22c55e]">+14</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>9.0 - 9.4</span>
                  <b className="text-[#22c55e]">+13</b>
                </div>
              </div>
              <div className="bg-[#14532d] p-3 rounded-lg border border-green-500/20 shadow-lg">
                <div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">
                  Muy Bueno
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>8.6 - 8.9</span>
                  <b className="text-[#4ade80]">+12</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>8.2 - 8.5</span>
                  <b className="text-[#4ade80]">+11</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>8.0 - 8.1</span>
                  <b className="text-[#4ade80]">+10</b>
                </div>
              </div>
              <div className="bg-[#166534] p-3 rounded-lg border border-green-500/20 shadow-lg">
                <div className="font-black text-white text-sm uppercase mb-2 border-b border-white/10 pb-1">
                  Bueno
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>7.8 - 7.9</span>
                  <b className="text-[#86efac]">+9</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>7.6 - 7.7</span>
                  <b className="text-[#86efac]">+8</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>7.4 - 7.5</span>
                  <b className="text-[#86efac]">+7</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>7.2 - 7.3</span>
                  <b className="text-[#86efac]">+6</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-300">
                  <span>7.0 - 7.1</span>
                  <b className="text-[#86efac]">+5</b>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-[#374151] p-3 rounded-lg border border-gray-500/20 shadow-lg">
                <div className="font-black text-gray-300 text-sm uppercase mb-2 border-b border-white/10 pb-1">
                  Medio
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-400">
                  <span>6.8 - 6.9</span>
                  <b className="text-white">+4</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-400">
                  <span>6.6 - 6.7</span>
                  <b className="text-white">+3</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-400">
                  <span>6.4 - 6.5</span>
                  <b className="text-white">+2</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-400">
                  <span>6.2 - 6.3</span>
                  <b className="text-white">+1</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-gray-400">
                  <span>6.0 - 6.1</span>
                  <b className="text-white">0</b>
                </div>
              </div>
              <div className="bg-[#7f1d1d] p-3 rounded-lg border border-red-500/20 shadow-lg">
                <div className="font-black text-red-200 text-sm uppercase mb-2 border-b border-white/10 pb-1">
                  Malo
                </div>
                <div className="flex justify-between px-2 py-0.5 text-red-100">
                  <span>5.8 - 5.9</span>
                  <b className="text-white">-1</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-red-100">
                  <span>5.6 - 5.7</span>
                  <b className="text-white">-2</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-red-100">
                  <span>5.4 - 5.5</span>
                  <b className="text-white">-3</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-red-100">
                  <span>5.2 - 5.3</span>
                  <b className="text-white">-4</b>
                </div>
              </div>
              <div className="bg-[#450a0a] p-3 rounded-lg border border-red-900/40 shadow-lg">
                <div className="font-black text-red-400 text-sm uppercase mb-2 border-b border-white/10 pb-1">
                  Muy Malo
                </div>
                <div className="flex justify-between px-2 py-0.5 text-red-300">
                  <span>5.0 - 5.1</span>
                  <b className="text-white">-5</b>
                </div>
                <div className="flex justify-between px-2 py-0.5 text-red-300">
                  <span>0.0 - 4.9</span>
                  <b className="text-white">-6</b>
                </div>
              </div>
            </div>
          </div>
        </RuleCard>

        <RuleCard
          color="#06b6d4"
          title="6. QUINIELA MUNDIAL"
          icon={<span className="text-2xl">🏆</span>}
        >
          <p className="text-sm mb-4 text-left text-gray-300 leading-relaxed">
            Acierta los 2 clasificados de cada uno de los 12 grupos para ganar
            presupuesto extra en las ventanas de fichajes:
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-black text-center uppercase tracking-wide">
            <div className="bg-[#ea580c] text-white p-3 rounded-lg shadow-md border border-white/5">
              24 aciertos <span className="block text-lg">50 M</span>
            </div>
            <div className="bg-[#06b6d4] text-black p-3 rounded-lg shadow-md border border-white/5">
              18 aciertos <span className="block text-lg">28 M</span>
            </div>

            <div className="bg-[#f59e0b] text-black p-3 rounded-lg shadow-md border border-white/5">
              23 aciertos <span className="block text-lg">45 M</span>
            </div>
            <div className="bg-[#3b82f6] text-white p-3 rounded-lg shadow-md border border-white/5">
              16 aciertos <span className="block text-lg">22 M</span>
            </div>

            <div className="bg-[#eab308] text-black p-3 rounded-lg shadow-md border border-white/5">
              22 aciertos <span className="block text-lg">41 M</span>
            </div>
            <div className="bg-[#84cc16] text-black p-3 rounded-lg shadow-md border border-white/5">
              14 aciertos <span className="block text-lg">18 M</span>
            </div>

            <div className="bg-[#10b981] text-white p-3 rounded-lg shadow-md border border-white/5">
              21 aciertos <span className="block text-lg">37 M</span>
            </div>
            <div className="bg-gray-500 text-white p-3 rounded-lg shadow-md border border-white/5">
              12 aciertos <span className="block text-lg">14 M</span>
            </div>

            <div className="bg-[#059669] text-white p-3 rounded-lg shadow-md border border-white/5">
              20 aciertos <span className="block text-lg">34 M</span>
            </div>
            <div className="bg-gray-700 text-white/70 p-3 rounded-lg shadow-md border border-white/5">
              10 aciertos <span className="block text-lg">10 M</span>
            </div>
          </div>
        </RuleCard>

        <RuleCard
          color="#ffd700"
          title="7. PREMIO"
          icon={<span className="text-2xl">🥇</span>}
        >
          <div className="text-center p-6 bg-[#ffd700]/10 rounded-xl border border-[#ffd700]/30 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
            <h4 className="text-[#ffd700] font-black uppercase text-2xl mb-1 tracking-tight drop-shadow-sm">
              Prestigio Eterno
            </h4>
            <p className="text-sm text-white/80 mb-6 italic">
              La satisfacción de ganar a tus amigos es el verdadero trofeo.
            </p>
            <div className="border-t border-[#ffd700]/20 pt-6">
              <span className="bg-[#ffd700] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Opcional
              </span>
              <p className="mt-3 text-lg font-bold text-white mb-6">
                Apuesta: <span className="text-[#ffd700] text-2xl">5€</span>
              </p>
              <div className="flex justify-center items-end gap-6">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl filter brightness-125">🥈</span>
                  <span className="text-xs font-bold text-gray-400">
                    2º Puesto
                  </span>
                  <span className="text-xl font-black text-[#e2e8f0]">30%</span>
                </div>
                <div className="flex flex-col items-center gap-1 -mt-4">
                  <span className="text-5xl filter brightness-110">🥇</span>
                  <span className="text-sm font-black text-[#ffd700] uppercase tracking-wide">
                    1º Puesto
                  </span>
                  <span className="text-3xl font-black text-white drop-shadow-md">
                    60%
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl filter saturate-150">🥉</span>
                  <span className="text-xs font-bold text-orange-700/80">
                    3º Puesto
                  </span>
                  <span className="text-xl font-black text-[#f97316]">10%</span>
                </div>
              </div>
            </div>
          </div>
        </RuleCard>
      </div>
    </div>
  );
};

// ==========================================
// 7. COMPONENTE DE PUNTUACIÓN (MODO DIOS)
// ==========================================

const MatchAdminRow = ({ match, onSave }: any) => {
  const [hScore, setHScore] = useState<number | ''>(match.home_score ?? '');
  const [aScore, setAScore] = useState<number | ''>(match.away_score ?? '');

  return (
    <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
      <div className="flex flex-col items-center w-1/3">
        <img
          src={getFlag(match.home)}
          className="w-8 h-5 object-cover rounded shadow-sm mb-1"
        />
        <span className="text-[10px] font-black text-white/70 uppercase text-center leading-tight">
          {match.home}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={hScore}
          onChange={(e) =>
            setHScore(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-10 h-10 bg-black border border-white/20 rounded text-center font-black text-lg focus:border-[#22c55e] outline-none"
        />
        <span className="text-white/20 font-black">:</span>
        <input
          type="number"
          value={aScore}
          onChange={(e) =>
            setAScore(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-10 h-10 bg-black border border-white/20 rounded text-center font-black text-lg focus:border-[#22c55e] outline-none"
        />
      </div>

      <div className="flex flex-col items-center w-1/3">
        <img
          src={getFlag(match.away)}
          className="w-8 h-5 object-cover rounded shadow-sm mb-1"
        />
        <span className="text-[10px] font-black text-white/70 uppercase text-center leading-tight">
          {match.away}
        </span>
      </div>

      <button
        onClick={() => onSave(match.id, hScore, aScore)}
        className="bg-[#22c55e]/20 text-[#22c55e] p-2 rounded hover:bg-[#22c55e]/40 transition-colors"
      >
        💾
      </button>
    </div>
  );
};

const PlayerAdminRow = ({
  p,
  savedScore,
  onScoreSaved,
  adminMatchday,
  isMatchdayClosed,
}: any) => {
  const [manualPts, setManualPts] = useState(0);
  const [played, setPlayed] = useState(false);
  const [starter, setStarter] = useState(false);
  const [matchRes, setMatchRes] = useState<'win' | 'loss' | null>(null);
  const [sofa, setSofa] = useState<number | ''>('');
  const [cleanSheet, setCleanSheet] = useState(false);
  const [gkGoals, setGkGoals] = useState<number | ''>('');
  const [doubleYellow, setDoubleYellow] = useState(false);
  const [red, setRed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [dnp, setDnp] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (savedScore !== undefined) {
      setIsLocked(true);
      if (savedScore === null) {
        setDnp(true);
        setManualPts(0);
      } else {
        setDnp(false);
        setManualPts(savedScore);
      }
    } else {
      setIsLocked(false);
      setDnp(false);
      setManualPts(0);
    }
    setPlayed(false);
    setStarter(false);
    setMatchRes(null);
    setSofa('');
    setCleanSheet(false);
    setGkGoals('');
    setDoubleYellow(false);
    setRed(false);
  }, [p.id, adminMatchday, savedScore]);

  const getGkGoalsPts = (goals: number | '') => {
    if (goals === '') return 0;
    if (goals === 0) return 4;
    if (goals === 1) return 0;
    return -goals;
  };
  const totalPts =
    manualPts +
    (played ? 1 : 0) +
    (starter ? 1 : 0) +
    (matchRes === 'win' ? 1 : matchRes === 'loss' ? -1 : 0) +
    (sofa !== '' ? Number(sofa) : 0) +
    (cleanSheet && p.posicion === 'DEF' ? 2 : 0) +
    (p.posicion === 'POR' ? getGkGoalsPts(gkGoals) : 0) +
    (doubleYellow ? -3 : 0) +
    (red ? -5 : 0);

  const handleReset = () => {
    setManualPts(0);
    setPlayed(false);
    setStarter(false);
    setMatchRes(null);
    setSofa('');
    setCleanSheet(false);
    setGkGoals('');
    setDoubleYellow(false);
    setRed(false);
    setDnp(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const finalValue = dnp ? null : totalPts;

    const { error } = await supabase
      .from('player_scores')
      .upsert(
        { player_id: p.id, matchday: adminMatchday, points: finalValue },
        { onConflict: 'player_id, matchday' }
      );

    if (!error) {
      onScoreSaved(p.id, finalValue);
      setIsLocked(true);
    } else {
      alert('Error al guardar en la nube: ' + error.message);
    }
    setIsSaving(false);
  };

  const sofascoreOptions = [
    { label: '9.5 - 10 (+14)', val: 14 },
    { label: '9.0 - 9.4 (+13)', val: 13 },
    { label: '8.6 - 8.9 (+12)', val: 12 },
    { label: '8.2 - 8.5 (+11)', val: 11 },
    { label: '8.0 - 8.1 (+10)', val: 10 },
    { label: '7.8 - 7.9 (+9)', val: 9 },
    { label: '7.6 - 7.7 (+8)', val: 8 },
    { label: '7.4 - 7.5 (+7)', val: 7 },
    { label: '7.2 - 7.3 (+6)', val: 6 },
    { label: '7.0 - 7.1 (+5)', val: 5 },
    { label: '6.8 - 6.9 (+4)', val: 4 },
    { label: '6.6 - 6.7 (+3)', val: 3 },
    { label: '6.4 - 6.5 (+2)', val: 2 },
    { label: '6.2 - 6.3 (+1)', val: 1 },
    { label: '6.0 - 6.1 (0)', val: 0 },
    { label: '5.8 - 5.9 (-1)', val: -1 },
    { label: '5.6 - 5.7 (-2)', val: -2 },
    { label: '5.4 - 5.5 (-3)', val: -3 },
    { label: '5.2 - 5.3 (-4)', val: -4 },
    { label: '5.0 - 5.1 (-5)', val: -5 },
    { label: '0.0 - 4.9 (-6)', val: -6 },
  ];
  const gkGoalsOptions = [
    { label: '0 Goles (+4)', val: 0 },
    { label: '1 Gol (0)', val: 1 },
    { label: '2 Goles (-2)', val: 2 },
    { label: '3 Goles (-3)', val: 3 },
    { label: '4 Goles (-4)', val: 4 },
    { label: '5 Goles (-5)', val: 5 },
    { label: '6 Goles (-6)', val: 6 },
    { label: '7 Goles (-7)', val: 7 },
    { label: '8 Goles (-8)', val: 8 },
    { label: '9 Goles (-9)', val: 9 },
    { label: '10 Goles (-10)', val: 10 },
  ];

  const isFormDisabled = isLocked || isMatchdayClosed;

  return (
    <div
      className={`bg-[#1c2a45] border rounded-xl p-3 flex flex-col gap-3 transition-all ${
        isLocked
          ? 'border-yellow-500/30 bg-yellow-900/10'
          : dnp
          ? 'bg-[#0d1526] border-red-900/50'
          : 'border-white/5 hover:bg-white/5'
      }`}
    >
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <img
            src={getFlag(p.seleccion)}
            alt={p.seleccion}
            className={`w-7 h-5 object-cover rounded shadow-sm ${
              dnp ? 'grayscale opacity-50' : ''
            }`}
          />
          <div>
            <span
              className={`font-bold block leading-none ${
                dnp ? 'text-white/50 line-through' : 'text-white'
              }`}
            >
              {p.nombre}
            </span>
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded mt-1 inline-block ${
                posColors[p.posicion]
              } ${dnp ? 'opacity-50' : ''}`}
            >
              {p.posicion}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={isFormDisabled}
            onClick={() => setDnp(!dnp)}
            className={`px-2 py-1.5 rounded text-[9px] font-black transition-all border ${
              dnp
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)] scale-105'
                : 'bg-black/40 text-white/40 border-white/10 hover:text-white'
            } ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            NO JUEGA
          </button>

          <div
            className={`w-10 h-8 rounded flex items-center justify-center font-black text-sm border ${
              dnp
                ? 'bg-red-900/40 text-red-500 border-red-500/50'
                : 'bg-black text-white border-white/10'
            }`}
          >
            {dnp ? 'X' : totalPts}
          </div>

          {isMatchdayClosed ? (
            <div className="bg-red-900/50 text-red-400 px-3 py-2 rounded font-black text-[10px] uppercase border border-red-500/50 cursor-not-allowed">
              CERRADO
            </div>
          ) : isLocked ? (
            <button
              onClick={() => setIsLocked(false)}
              className="bg-[#facc15] text-black px-3 py-2 rounded font-black text-[10px] uppercase active:scale-95 transition-all shadow-lg border border-yellow-600 hover:bg-yellow-400"
            >
              EDITAR
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`text-white px-3 py-2 rounded font-black text-[10px] uppercase active:scale-95 transition-all shadow-lg ${
                isSaving ? 'bg-gray-500' : 'bg-[#22c55e] hover:bg-green-600'
              }`}
            >
              {isSaving ? '...' : 'GUARDAR'}
            </button>
          )}
        </div>
      </div>

      <div
        className={`flex flex-col gap-2 transition-all duration-300 ${
          isFormDisabled
            ? 'opacity-40 pointer-events-none grayscale'
            : dnp
            ? 'opacity-30 pointer-events-none grayscale'
            : ''
        }`}
      >
        <div className="flex flex-wrap gap-1 items-center">
          <button
            onClick={() => setPlayed(!played)}
            className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${
              played
                ? 'bg-blue-600 text-white'
                : 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
            }`}
          >
            +1 Juega
          </button>
          <button
            onClick={() => setStarter(!starter)}
            className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${
              starter
                ? 'bg-blue-600 text-white'
                : 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
            }`}
          >
            +1 Titular
          </button>
          <button
            onClick={() => setMatchRes(matchRes === 'win' ? null : 'win')}
            className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${
              matchRes === 'win'
                ? 'bg-green-600 text-white'
                : 'bg-green-900/30 text-green-500 border border-green-500/30'
            }`}
          >
            +1 Victoria
          </button>
          <button
            onClick={() => setMatchRes(matchRes === 'loss' ? null : 'loss')}
            className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${
              matchRes === 'loss'
                ? 'bg-red-600 text-white'
                : 'bg-red-900/30 text-red-500 border border-red-500/30'
            }`}
          >
            -1 Derrota
          </button>
          <select
            value={sofa}
            onChange={(e) =>
              setSofa(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={`px-2 py-1 rounded text-[9px] font-black outline-none appearance-none cursor-pointer ${
              sofa !== ''
                ? 'bg-[#a855f7] text-white shadow-lg'
                : 'bg-[#a855f7]/20 text-[#d8b4fe] border border-[#a855f7]/50'
            }`}
          >
            <option value="">⭐ SOFASCORE</option>
            {sofascoreOptions.map((opt) => (
              <option
                key={opt.label}
                value={opt.val}
                className="bg-[#1c2a45] text-white"
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-1 items-center">
          <button
            onClick={() => setManualPts((p) => p + 5)}
            className="px-2 py-1 bg-green-900/30 text-green-500 border border-green-500/30 rounded text-[9px] font-black active:bg-green-900/50"
          >
            +5 Gol
          </button>
          <button
            onClick={() => setManualPts((p) => p + 1)}
            className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-500/30 rounded text-[9px] font-black active:bg-blue-900/50"
          >
            +1 Asist.
          </button>
          <button
            onClick={() => setManualPts((p) => p + 5)}
            className="px-2 py-1 bg-green-900/30 text-green-500 border border-green-500/30 rounded text-[9px] font-black active:bg-green-900/50"
          >
            +5 Pen. Marc.
          </button>
          {p.posicion === 'DEF' && (
            <button
              onClick={() => setCleanSheet(!cleanSheet)}
              className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${
                cleanSheet
                  ? 'bg-yellow-500 text-black shadow-lg'
                  : 'bg-yellow-900/30 text-yellow-500 border border-yellow-500/30'
              }`}
            >
              +2 P. Cero
            </button>
          )}
          {p.posicion === 'POR' && (
            <>
              <select
                value={gkGoals}
                onChange={(e) =>
                  setGkGoals(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                className={`px-2 py-1 rounded text-[9px] font-black outline-none appearance-none cursor-pointer ${
                  gkGoals !== ''
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                }`}
              >
                <option value="">🧤 GOLES ENC.</option>
                {gkGoalsOptions.map((opt) => (
                  <option
                    key={opt.label}
                    value={opt.val}
                    className="bg-[#1c2a45] text-white"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setManualPts((p) => p + 3)}
                className="px-2 py-1 bg-teal-900/30 text-teal-400 border border-teal-500/30 rounded text-[9px] font-black active:bg-teal-900/50"
              >
                +3 Para Pen.
              </button>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1 items-center">
          <button
            onClick={() => setDoubleYellow(!doubleYellow)}
            className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${
              doubleYellow
                ? 'bg-orange-500 text-black shadow-lg'
                : 'bg-orange-900/30 text-orange-500 border border-orange-500/30'
            }`}
          >
            -3 Dob. Amarilla
          </button>
          <button
            onClick={() => setRed(!red)}
            className={`px-2 py-1 rounded text-[9px] font-black transition-colors ${
              red
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-red-900/30 text-red-500 border border-red-500/30'
            }`}
          >
            -5 Roja
          </button>
          <button
            onClick={() => setManualPts((p) => p - 3)}
            className="px-2 py-1 bg-orange-900/30 text-orange-500 border border-orange-500/30 rounded text-[9px] font-black active:bg-orange-900/50"
          >
            -3 Fall. Pen.
          </button>
          <button
            onClick={() => setManualPts((p) => p - 1)}
            className="px-2 py-1 bg-red-900/30 text-red-500 border border-red-500/30 rounded text-[9px] font-black active:bg-red-900/50"
          >
            -1 Prop. Meta
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1 bg-black text-white/50 border border-white/20 rounded text-[9px] font-black hover:text-white ml-auto pointer-events-auto"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. VISTA DE LA QUINIELA MUNDIAL (EVOLUCIONADA)
// ==========================================

const GROUPS_2026 = [
  { id: 'A', teams: ['México', 'Sudáfrica', 'Rep. de Corea', 'Chequia'] },
  { id: 'B', teams: ['Canadá', 'Bosnia/Herzeg.', 'Qatar', 'Suiza'] },
  { id: 'C', teams: ['Brasil', 'Marruecos', 'Haiti', 'Escocia'] },
  { id: 'D', teams: ['EE.UU.', 'Paraguay', 'Australia', 'Turquía'] },
  { id: 'E', teams: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
  { id: 'F', teams: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  { id: 'G', teams: ['Bélgica', 'Egipto', 'IR Irán', 'Nueva Zelanda'] },
  { id: 'H', teams: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'] },
  { id: 'I', teams: ['Francia', 'Senegal', 'Iraq', 'Noruega'] },
  { id: 'J', teams: ['Argentina', 'Argelia', 'Austria', 'Jordán'] },
  { id: 'K', teams: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'] },
  { id: 'L', teams: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
];

const PRIZE_SCALE = [
  { hits: 24, prize: 50, color: '#ea580c' }, // Naranja fuerte
  { hits: 23, prize: 45, color: '#f59e0b' }, // Naranja claro/Ámbar
  { hits: 22, prize: 41, color: '#eab308' }, // Amarillo
  { hits: 21, prize: 37, color: '#10b981' }, // Verde esmeralda
  { hits: 20, prize: 34, color: '#059669' }, // Verde oscuro
  { hits: 18, prize: 28, color: '#06b6d4' }, // Cian
  { hits: 16, prize: 22, color: '#3b82f6' }, // Azul
  { hits: 14, prize: 18, color: '#84cc16' }, // Verde lima
  { hits: 12, prize: 14, color: '#6b7280' }, // Gris medio
  { hits: 10, prize: 10, color: '#4b5563' }, // Gris oscuro
];

const QuinielaView = ({ user }: { user: any }) => {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Equipos clasificados (esto se conectará al Modo Dios)
  const qualifiedTeams: string[] = [];

  useEffect(() => {
    const loadPredictions = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('user_predictions')
          .select('selections')
          .eq('user_id', user.id)
          .single();
        if (data?.selections) {
          setSelections(data.selections);
          setIsSaved(true);
        }
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };
    loadPredictions();
  }, [user]);

  const toggleTeam = (groupId: string, team: string) => {
    if (isSaved) return;
    setSelections((prev) => {
      const groupSels = prev[groupId] || [];
      if (groupSels.includes(team))
        return { ...prev, [groupId]: groupSels.filter((t) => t !== team) };
      if (groupSels.length < 2)
        return { ...prev, [groupId]: [...groupSels, team] };
      return prev;
    });
  };

  const handleSave = async () => {
    if (!user) return alert('Inicia sesión.');
    await supabase.from('user_predictions').upsert({
      user_id: user.id,
      selections,
      updated_at: new Date().toISOString(),
    });
    setIsSaved(true);
  };

  const allPicks = Object.values(selections).flat();
  const hitsCount = allPicks.filter((team) =>
    qualifiedTeams.includes(team)
  ).length;
  const totalSelected = allPicks.length;
  const isComplete = totalSelected === 24;

  // Calcular premio actual
  const currentPrize =
    [...PRIZE_SCALE].find((p) => hitsCount >= p.hits)?.prize || 0;

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64 text-[#06b6d4] font-black animate-pulse">
        CARGANDO MUNDIAL...
      </div>
    );

  return (
    <div className="pb-32 animate-in fade-in duration-500 max-w-6xl mx-auto px-4">
      {/* LÍNEA DE RECUENTO COMPACTA */}
      <div className="grid grid-cols-3 gap-3 mb-6 max-w-3xl mx-auto">
        <div className="bg-[#1a0b0b] border border-green-500/20 rounded-xl p-3 text-center shadow-md">
          <span className="block text-[9px] font-black text-green-500 uppercase tracking-widest mb-0.5">
            Aciertos
          </span>
          <span className="text-2xl font-black text-white">{hitsCount}</span>
        </div>
        <div className="bg-[#1a0b0b] border border-white/5 rounded-xl p-3 text-center shadow-md">
          <span className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">
            Pendientes
          </span>
          <span className="text-2xl font-black text-white/60">
            {24 - hitsCount}
          </span>
        </div>
        <div className="bg-[#1a0b0b] border border-[#06b6d4]/20 rounded-xl p-3 text-center shadow-md">
          <span className="block text-[9px] font-black text-[#06b6d4] uppercase tracking-widest mb-0.5">
            Presupuesto
          </span>
          <span className="text-2xl font-black text-white">
            {currentPrize}M
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* TABLA DE PREMIOS EN 2 COLUMNAS */}
        <div className="w-full lg:w-80 bg-[#0a101f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shrink-0">
          <div className="bg-white/5 p-3 border-b border-white/10 text-center">
            <h3 className="font-black text-[9px] uppercase tracking-widest text-white/40">
              Escala de Premios
            </h3>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {PRIZE_SCALE.map((item) => {
              // Lógica de iluminación:
              const isHighestAchieved = currentPrize === item.prize && hitsCount > 0;
              const isAchieved = hitsCount >= item.hits && hitsCount > 0;

              return (
                <div
                  key={item.hits}
                  style={{
                    backgroundColor: isHighestAchieved ? item.color : isAchieved ? `${item.color}15` : 'transparent',
                    borderColor: isAchieved ? item.color : 'rgba(255,255,255,0.05)',
                    boxShadow: isHighestAchieved ? `0 0 20px ${item.color}80` : 'none',
                    color: isHighestAchieved ? '#000' : isAchieved ? item.color : 'rgba(255,255,255,0.2)'
                  }}
                  className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-all duration-500 ${
                    isHighestAchieved ? 'scale-105 font-black z-10' : 'font-bold'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider">{item.hits} Aciertos</span>
                  <span className="text-sm">{item.prize}M</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CUADRÍCULA DE GRUPOS */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {GROUPS_2026.map((group) => {
            const groupSels = selections[group.id] || [];
            const isFull = groupSels.length === 2;
            return (
              <div
                key={group.id}
                className="bg-black/40 border border-white/10 rounded-2xl p-4"
              >
                <h3 className="text-center font-black text-[#06b6d4] text-[10px] uppercase mb-4 tracking-widest border-b border-white/5 pb-2">
                  Grupo {group.id}
                </h3>
                <div className="space-y-1.5">
                  {group.teams.map((team) => {
                    const isSelected = groupSels.includes(team);
                    const isRight = qualifiedTeams.includes(team);
                    return (
                      <button
                        key={team}
                        onClick={() => toggleTeam(group.id, team)}
                        disabled={isSaved || (!isSelected && isFull)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-black transition-all ${
                          isSelected
                            ? isSaved
                              ? 'bg-yellow-500 text-black'
                              : 'bg-[#06b6d4] text-black'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={getFlag(team)}
                            alt=""
                            className="w-5 h-3.5 object-cover rounded-sm"
                          />
                          <span>{team}</span>
                        </div>
                        {isSelected && <span>{isRight ? '🎯' : '✓'}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTÓN DE ACCIÓN FLOTANTE (Alineado a la derecha) */}
      <div className="fixed bottom-24 right-6 z-50 flex gap-4">
        {isSaved ? (
          <button
            onClick={() => setIsSaved(false)}
            className="px-6 py-3.5 bg-yellow-500 text-black rounded-full font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-105 transition-transform border-2 border-black"
          >
            Editar Pronóstico
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!isComplete}
            className={`px-6 py-3.5 rounded-full font-black uppercase text-xs tracking-widest shadow-2xl transition-all border-2 border-black ${
              isComplete
                ? 'bg-[#22c55e] text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105'
                : 'bg-gray-800 text-white/20'
            }`}
          >
            {isComplete ? 'Guardar Selección' : `Faltan ${24 - totalSelected}`}
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 9. VISTA DE CALENDARIO, GRUPOS Y ELIMINATORIAS
// ==========================================

const CalendarView = () => {
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout'>('groups');
  const [activeGroup, setActiveGroup] = useState('A');
  const [results, setResults] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchResults = async () => {
      const { data } = await supabase.from('match_results').select('*');
      if (data) {
        const map: any = {};
        data.forEach((r) => (map[r.match_id] = r));
        setResults(map);
      }
    };
    fetchResults();
  }, []);

  const activeGroupData = GROUPS_2026.find((g) => g.id === activeGroup);

  const standings = useMemo(() => {
    if (!activeGroupData) return [];
    let table: any = {};
    activeGroupData.teams.forEach(
      (t) => (table[t] = { name: t, pts: 0, pj: 0, gf: 0, gc: 0, dif: 0 })
    );

    [1, 2, 3, 4, 5, 6].forEach((num) => {
      const mId = `G_${activeGroup}_${num}`;
      const res = results[mId];
      if (res && res.home_score !== null && res.away_score !== null) {
        const order = [
          [0, 1],
          [2, 3],
          [0, 2],
          [3, 1],
          [3, 0],
          [1, 2],
        ];
        const homeTeam = activeGroupData.teams[order[num - 1][0]];
        const awayTeam = activeGroupData.teams[order[num - 1][1]];

        table[homeTeam].pj++;
        table[awayTeam].pj++;
        table[homeTeam].gf += res.home_score;
        table[homeTeam].gc += res.away_score;
        table[awayTeam].gf += res.away_score;
        table[awayTeam].gc += res.home_score;

        if (res.home_score > res.away_score) table[homeTeam].pts += 3;
        else if (res.home_score < res.away_score) table[awayTeam].pts += 3;
        else {
          table[homeTeam].pts += 1;
          table[awayTeam].pts += 1;
        }

        table[homeTeam].dif = table[homeTeam].gf - table[homeTeam].gc;
        table[awayTeam].dif = table[awayTeam].gf - table[awayTeam].gc;
      }
    });

    return Object.values(table).sort(
      (a: any, b: any) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf
    );
  }, [activeGroup, results]);

  const groupMatches = useMemo(() => {
    if (!activeGroupData) return [];
    const order = [
      [0, 1],
      [2, 3],
      [0, 2],
      [3, 1],
      [3, 0],
      [1, 2],
    ];
    // Horarios aproximados basados en el orden de partidos
    const schedule = [
      { d: '11/12 Jun', t: '20:00/03:00' },
      { d: '12/13 Jun', t: '20:00/02:00' },
      { d: '17/18 Jun', t: '21:00/03:00' },
      { d: '18/19 Jun', t: '21:00/03:00' },
      { d: '24 Jun', t: '03:00' },
      { d: '24 Jun', t: '03:00' },
    ];
    return order.map((idx, i) => ({
      id: `G_${activeGroup}_${i + 1}`,
      home: activeGroupData.teams[idx[0]],
      away: activeGroupData.teams[idx[1]],
      day: schedule[i].d,
      time: schedule[i].t,
      label: `Jornada ${i < 2 ? 1 : i < 4 ? 2 : 3}`,
    }));
  }, [activeGroup]);

  const knockoutRounds = [
    {
      title: 'Dieciseisavos',
      pairs: [
        ['2A', '2B'],
        ['1A', '3º C/E/F/H/I'],
        ['1B', '3º A/C/D/F/G'],
        ['1C', '3º A/B/F/I/J'],
        ['1F', '2C'],
        ['2E', '2F'],
        ['1D', '3º B/E/F/I/J'],
        ['1G', '3º A/E/H/I/J'],
      ],
    },
    {
      title: 'Octavos',
      pairs: [
        ['W73', 'W74'],
        ['W75', 'W76'],
        ['W77', 'W78'],
        ['W79', 'W80'],
      ],
    },
    {
      title: 'Cuartos',
      pairs: [
        ['W89', 'W90'],
        ['W91', 'W92'],
      ],
    },
    { title: 'Semis', pairs: [['W97', 'W98']] },
    { title: 'Final', pairs: [['W101', 'W102']] },
  ];

  return (
    <div className="pb-32 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10 shadow-inner">
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${
            activeTab === 'groups'
              ? 'bg-[#22c55e] text-black shadow-lg scale-[1.02]'
              : 'text-white/40 hover:text-white'
          }`}
        >
          Fase de Grupos
        </button>
        <button
          onClick={() => setActiveTab('knockout')}
          className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${
            activeTab === 'knockout'
              ? 'bg-[#22c55e] text-black shadow-lg scale-[1.02]'
              : 'text-white/40 hover:text-white'
          }`}
        >
          Eliminatorias
        </button>
      </div>

      {activeTab === 'groups' ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
            {GROUPS_2026.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase whitespace-nowrap transition-all ${
                  activeGroup === g.id
                    ? 'bg-white/10 text-[#22c55e] border border-[#22c55e]/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                    : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                }`}
              >
                G{g.id}
              </button>
            ))}
          </div>

          <div className="bg-[#0a101f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-black/40 text-white/30 font-black uppercase tracking-tighter">
                <tr>
                  <th className="px-4 py-3 text-center w-8">#</th>
                  <th className="px-4 py-3">Selección</th>
                  <th className="px-3 py-3 text-center text-white">Pts</th>
                  <th className="px-3 py-3 text-center">PJ</th>
                  <th className="px-3 py-3 text-center">GF</th>
                  <th className="px-3 py-3 text-center">GC</th>
                  <th className="px-3 py-3 text-center">DF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
              {standings.map((team: any, index: number) => (
                  <tr
                    key={team.name}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-4 text-center font-black text-white/10">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={getFlag(team.name)}
                          alt={team.name}
                          className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
                        />
                        <span className="font-bold text-white uppercase tracking-tight">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center font-black text-[#22c55e] text-sm bg-[#22c55e]/5">
                      {team.pts}
                    </td>
                    <td className="px-3 py-4 text-center text-white/70">
                      {team.pj}
                    </td>
                    <td className="px-3 py-4 text-center text-white/70">
                      {team.gf}
                    </td>
                    <td className="px-3 py-4 text-center text-white/70">
                      {team.gc}
                    </td>
                    <td className="px-3 py-4 text-center text-white/70 font-bold">
                      {team.dif}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            {groupMatches.map((m) => (
              <div
                key={m.id}
                className="bg-[#0a101f] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-all shadow-md"
              >
                <div className="flex flex-col items-center gap-1 w-1/3">
                  <img
                    src={getFlag(m.home)}
                    className="w-8 h-5 object-cover rounded-sm"
                  />
                  <span className="text-[10px] font-black uppercase text-center text-white/90">
                    {m.home}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center w-1/3">
                  <div className="bg-black/60 px-4 py-1.5 rounded-lg text-lg font-black text-white border border-white/10 shadow-inner group-hover:text-[#22c55e] transition-colors tabular-nums">
                    {results[m.id]?.home_score ?? '-'} :{' '}
                    {results[m.id]?.away_score ?? '-'}
                  </div>
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-[8px] text-[#22c55e] font-black uppercase">
                      {m.day}
                    </span>
                    <span className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">
                      {m.time} h
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/3">
                  <img
                    src={getFlag(m.away)}
                    className="w-8 h-5 object-cover rounded-sm"
                  />
                  <span className="text-[10px] font-black uppercase text-center text-white/90">
                    {m.away}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-10 py-4">
          {knockoutRounds.map((round, rIdx) => (
            <div key={rIdx} className="space-y-4">
              <h3 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#22c55e] opacity-60 flex items-center justify-center gap-4">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#22c55e]/30"></span>
                {round.title}
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#22c55e]/30"></span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {round.pairs.map((pair, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-[#0a101f] border border-white/5 p-4 rounded-2xl flex items-center justify-around relative shadow-xl hover:border-white/10 transition-all"
                  >
                    <div className="text-[11px] font-black text-white uppercase tracking-tighter w-24 text-center">
                      {pair[0]}
                    </div>
                    <div className="h-8 w-[1px] bg-white/5"></div>
                    <div className="text-[11px] font-black text-white uppercase tracking-tighter w-24 text-center">
                      {pair[1]}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black px-3 py-0.5 rounded-full border border-white/10 text-[7px] font-black text-white/30 uppercase tracking-widest shadow-lg">
                      PARTIDO {pIdx + 1 + rIdx * 8}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AuthScreen = ({
  onLoginSuccess,
}: {
  onLoginSuccess: (user: any) => void;
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [teamName, setTeamName] = useState('');

  // --- PASO 3: LÓGICA DE RECUPERAR CONTRASEÑA ---
  const handleResetPassword = async () => {
    if (!email) {
      alert('Por favor, introduce tu email en el campo correspondiente.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      alert('¡Email de recuperación enviado! Revisa tu bandeja de entrada.');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        // 1. Registro en Auth de Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
          }
        );
        if (authError) throw authError;

        // 2. Crear perfil en nuestra tabla pública
        if (authData.user) {
          // Al registrarse:
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                email: email,
                username: username, // Se guarda el nombre de usuario
                team_name: teamName.toUpperCase(), // Se guarda el nombre del equipo
              },
            ]);
          if (profileError) throw profileError;
          alert('¡Cuenta creada! Ya puedes entrar.');
          setIsRegister(false);
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Buscamos los datos del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        onLoginSuccess({ ...data.user, ...profile });
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080f] flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="max-w-md w-full bg-[#0a101f]/80 backdrop-blur-xl border-2 border-[#22c55e]/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(34,197,94,0.1)] transition-all">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic text-white tracking-tighter mb-2">
            MUNDIAL<span className="text-[#22c55e]">2026</span>
          </h1>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
            Eurocopa Fantástica Edition
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nombre de Usuario"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#22c55e] transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Nombre de tu Equipo"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#22c55e] transition-colors"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#22c55e] transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#22c55e] transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!loading}
          />

          {/* BOTÓN RECUPERAR (Solo se muestra en modo Login) */}
          {!isRegister && (
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-[10px] text-white/30 hover:text-yellow-400 transition-colors uppercase font-black text-left w-full pl-2 mt-1"
            >
              ¿Has olvidado tu contraseña?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#22c55e] text-black font-black uppercase rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50"
          >
            {loading
              ? 'Procesando...'
              : isRegister
              ? 'Crear Cuenta'
              : 'Entrar al Estadio'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className={`w-full mt-6 text-xs font-bold uppercase transition-all duration-300 ${
            isRegister
              ? 'text-white/40 hover:text-white'
              : 'text-yellow-400 animate-pulse scale-110 hover:scale-125 shadow-yellow-400/20'
          }`}
        >
          {isRegister ? (
            '¿Ya tienes cuenta? Logueate'
          ) : (
            <span className="flex items-center justify-center gap-2">
              ✨ ¿Eres nuevo? Regístrate aquí ✨
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 9. APP PRINCIPAL: INTERFAZ Y ESTADOS GLOBALES
// ==========================================

export default function MundialApp() {
  const [showSectionHelp, setShowSectionHelp] = useState<string | null>(null);

  const [session, setSession] = useState<any>(null);

  // 1. Sincronización de Sesión y Perfil Real (Con carga de plantilla)
  // 1. Sincronización de Sesión y Perfil Real (Con carga de plantilla)
  useEffect(() => {
    // Le pasamos el objeto de usuario completo de la sesión (que incluye el email real)
    const fetchUserProfile = async (sessionUser: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('team_name, username, squad_data')
        .eq('id', sessionUser.id)
        .single();

      if (data) {
        setUser({
          email: sessionUser.email, // <-- ¡LA CLAVE! Aquí sobreescribimos con el email real
          teamName: data.team_name,
          username: data.username,
          id: sessionUser.id
        });

        // Si hay datos de equipo guardados, los cargamos
        if (data.squad_data) {
          const { selected: s, bench: b, extras: e, captain: c } = data.squad_data;
          if (s) setSelected(s);
          if (b) setBench(b);
          if (e) setExtras(e);
          if (c) setCaptain(c);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      } else {
        // Al salir, lo dejamos como un simple invitado sin privilegios
        setUser({
          email: '', // <-- Ya no es admin por defecto
          username: 'Invitado',
          teamName: 'MI EQUIPO',
          id: '',
        });
        setSelected({});
        setBench({});
        setExtras({});
        setCaptain(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // 2. Estado de Usuario por defecto (Invitado, no Admin)
  const [user, setUser] = useState<any>({
    email: '',
    username: 'Invitado',
    teamName: 'MI EQUIPO',
    id: '',
  });
  const isAdmin = user?.email === 'admin@mundial2026.com';
  const [view, setView] = useState<
    'rules' | 'squad' | 'quiniela' | 'calendar' | 'lineups' | 'scores' | 'admin'
  >('rules');

  // --- 2. ESTADOS DEL TUTORIAL (CADDY) ---
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    // Si entra el administrador, fulminamos el tutorial para que no estorbe
    if (isAdmin) {
      setTutorialStep(0); // Usa 0, false, o el valor que tengas programado para que el tutorial desaparezca
    }
  }, [isAdmin]);

  // --- ESTADOS DE LA PLANTILLA (Carga desde Supabase) ---
  const [selected, setSelected] = useState<any>({});
  const [bench, setBench] = useState<any>({});
  const [extras, setExtras] = useState<any>({});
  const [captain, setCaptain] = useState<number | null>(null);

  const [isSquadLocked, setIsSquadLocked] = useState(() => {
    // Comprobamos si estamos en el navegador antes de leer la memoria
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ef24_isLocked');
      return saved ? JSON.parse(saved) : false;
    }
    return false; // Valor por defecto seguro para el servidor de Vercel
  });

  // --- 4. OTROS ESTADOS DE LA APP ---
  const [results, setResults] = useState<Record<string, any>>({});
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [step, setStep] = useState(2); // Esta es la que necesita el componente Field
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('SELECCIÓN');
  const [filterPosition, setFilterPosition] = useState('TODAS');
  const [sortOption, setSortOption] = useState<
    'price-desc' | 'price-asc' | 'name-asc' | 'name-desc'
  >('price-desc');
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketWindow, setMarketWindow] = useState<'groups' | 'octavos' | null>(
    'groups'
  );

  const [activeMatchday, setActiveMatchday] = useState('J1');
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [adminScoreCountry, setAdminScoreCountry] = useState('SELECCIÓN');

  // 1. Añade este estado arriba con tus otros useState de Admin
const [adminTab, setAdminTab] = useState<'partidos' | 'tesoreria' | 'puntos'>('partidos');
const [allProfiles, setAllProfiles] = useState<any[]>([]);

// 2. Función para cargar todos los usuarios (solo para el Admin)
const fetchAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, team_name, has_paid')
    .order('team_name', { ascending: true });
  if (data) setAllProfiles(data);
};

// Cargar perfiles cuando entres en Tesorería O en el Ranking de Puntos
useEffect(() => {
  if ((view === 'admin' && adminTab === 'tesoreria') || view === 'scores') {
    fetchAllProfiles();
  }
}, [view, adminTab]);

// 3. Función para cambiar el estado de pago
// --- ÚLTIMA FUNCIÓN DE LÓGICA (Asegúrate de que termina así) ---
const togglePayment = async (profileId: string, currentState: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ has_paid: !currentState })
    .eq('id', profileId);

  if (!error) {
    setAllProfiles(prev => 
      prev.map(p => p.id === profileId ? { ...p, has_paid: !currentState } : p)
    );
  }
};

  // ==========================================
  // NUEVA FUNCIÓN: GUARDADO EN SUPABASE
  // ==========================================
  const saveSquadToSupabase = async () => {
    if (!session?.user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        squad_data: {
          selected,
          bench,
          extras,
          captain,
        },
      })
      .eq('id', session.user.id);

    if (error) {
      console.error('Error al guardar en nube:', error.message);
    } else {
      console.log('¡Plantilla del Mundial sincronizada!');
    }
  };

  // --- 5. LÓGICA DE CONTROL DEL TUTORIAL ---
  useEffect(() => {
    const hasSeen = localStorage.getItem('mundial_caddy_v5');
    if (!hasSeen) {
      setIsTutorialActive(true);
      setTutorialStep(0);
      setView('rules');
    } else {
      // Si el jugador entra y ya hizo el tutorial otro día, la plantilla estará bloqueada
      setIsSquadLocked(true);
    }
  }, []);

  const nextStep = (targetView?: any) => {
    if (targetView) setView(targetView);
    if (targetView === 'quiniela') {
      setIsSquadLocked(true);
      saveSquadToSupabase(); // <-- Añade esto aquí también
    }
    setTutorialStep((prev) => prev + 1);
  };

  const handleCloseTutorial = (permanently: boolean) => {
    if (permanently) localStorage.setItem('mundial_caddy_v5', 'true');
    setIsTutorialActive(false);
    setTutorialStep(0);
    setIsSquadLocked(true); // Bloquea si decide saltarse el tutorial
  };

  // --- 6. MOTOR INTELIGENTE DEL CADDY (Vigilancia) ---
  useEffect(() => {
    if (!isTutorialActive) return;

    const numTitulares = Object.values(selected).filter(Boolean).length;
    const numSuplentes = Object.values(bench).filter(Boolean).length;
    // Eliminamos numReservas de aquí, el paso 4 ahora se controla desde los botones del Caddy

    if (tutorialStep === 1 && numTitulares === 11) setTutorialStep(2);
    if (tutorialStep === 2 && captain !== null) setTutorialStep(3);
    if (tutorialStep === 3 && numSuplentes === 6) setTutorialStep(4);
    // ¡El salto automático del paso 4 ha desaparecido!
  }, [selected, bench, extras, captain, tutorialStep, isTutorialActive]);

  // --- 7. CARGA DE DATOS (SUPABASE) ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: config } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (config) {
        setIsMarketOpen(config.is_market_open);
        setMarketWindow(config.market_window);
        setActiveMatchday(config.active_matchday);

        const { data: scoresData } = await supabase
          .from('player_scores')
          .select('*')
          .eq('matchday', config.active_matchday);
        if (scoresData) {
          const scoreMap: Record<string, number | null> = {};
          scoresData.forEach((row) => (scoreMap[row.player_id] = row.points));
          setScores(scoreMap);
        }
      }
    };
    fetchData();
  }, [activeMatchday]);

  // --- EFECTO DE AUTOGUARDADO (LocalStorage) ---
  useEffect(() => {
    localStorage.setItem('ef24_selected', JSON.stringify(selected));
    localStorage.setItem('ef24_bench', JSON.stringify(bench));
    localStorage.setItem('ef24_extras', JSON.stringify(extras));
    localStorage.setItem('ef24_captain', JSON.stringify(captain));
    localStorage.setItem('ef24_isLocked', JSON.stringify(isSquadLocked));
  }, [selected, bench, extras, captain, isSquadLocked]);

  // --- PROTECCIÓN CONTRA SALIDAS ACCIDENTALES EN MÓVILES ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = () => {
      const confirmExit = window.confirm('¿Quieres salir de la aplicación Mundial Fantástico 2026?');
      if (confirmExit) {
        window.history.back();
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Si entra el administrador, fulminamos el tutorial para que no estorbe
    if (isAdmin) {
      setTutorialStep(0); 
    }
  }, [isAdmin]);

  // --- AUTO-GUARDADO DE PLANTILLA EN SUPABASE ---
useEffect(() => {
  const saveSquadData = async () => {
    // Si no hay usuario real o es el ID de prueba, no guardamos
    if (!user?.id || user.id === '' || user.id === '000-111') return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        squad_data: { selected, bench, extras, captain },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }); // Esto asegura que si no existe, lo cree

    if (error) console.error("Error al guardar plantilla:", error);
  };

  saveSquadData();
}, [selected, bench, extras, captain, user?.id]);

  // --- 8. FUNCIONES DE GESTIÓN ---
  const toggleMarket = async () => {
    const newState = !isMarketOpen;
    setIsMarketOpen(newState); // Cambia el color del botón al instante

    // Mandamos la orden a la base de datos para que afecte a todos
    const { error } = await supabase
      .from('app_settings')
      .update({ is_market_open: newState })
      .eq('id', 1);

    if (error) {
      console.error("Error al cambiar el estado del mercado:", error.message);
      // Si falla la base de datos, revertimos el botón
      setIsMarketOpen(!newState);
    }
  };
  const changeMatchday = async (j: string) => {
    /* ... lógica supabase ... */
  };
  const handleScoreSaved = (playerId: string, finalValue: number | null) => {
    setScores((prev) => ({ ...prev, [playerId]: finalValue }));
  };

  // --- 9. CÁLCULOS DE PLANTILLA (USEMEMO) ---
  const allSquadPlayers = useMemo(
    () =>
      [
        ...Object.values(selected),
        ...Object.values(bench),
        ...Object.values(extras),
      ].filter(Boolean) as any[],
    [selected, bench, extras]
  );

  const budgetSpent =
    Math.round(
      allSquadPlayers.reduce((a: number, p: any) => a + p.precio, 0) * 10
    ) / 10;

  const availableBudget = Math.round((MAX_BUDGET - budgetSpent) * 10) / 10;
  const budgetPercent = Math.min((budgetSpent / MAX_BUDGET) * 100, 100);

  // Función para determinar el color de la barra de progreso
  const getBudgetColorClass = () => {
    if (budgetSpent > 450)
      return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
    if (budgetSpent >= 435)
      return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]';
    if (budgetSpent >= 400)
      return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]';
    return 'bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.8)]';
  };

  // Para mantener compatibilidad con otras partes de tu código (como el texto)
  const isBudgetLow = budgetSpent >= 435;

  // Calculamos las selecciones y añadimos el contador dinámico (X/7)
  const availableCountriesWithCount = useMemo(() => {
    const countries = new Set(PLAYERS_DB.map((p) => p.seleccion));
    const sortedCountries = Array.from(countries).sort();

    return [
      'SELECCIÓN',
      ...sortedCountries.map((c) => {
        const count = allSquadPlayers.filter((p) => p.seleccion === c).length;
        return `${c} (${count}/7)`;
      }),
    ];
  }, [allSquadPlayers]);

  const filteredAndSortedPlayers = useMemo(() => {
    return PLAYERS_DB.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.seleccion.toLowerCase().includes(searchTerm.toLowerCase());

      // Limpiamos el nombre de la selección quitando el " (X/7)" para filtrar correctamente
      const cleanFilterCountry =
        filterCountry === 'SELECCIÓN'
          ? 'SELECCIÓN'
          : filterCountry.split(' (')[0];
      const matchesCountry =
        cleanFilterCountry === 'SELECCIÓN' ||
        p.seleccion === cleanFilterCountry;

      let matchesPosition = true;
      if (activeSlot && activeSlot.type === 'titular')
        matchesPosition = p.posicion === activeSlot.pos;
      else
        matchesPosition =
          filterPosition === 'TODAS' || p.posicion === filterPosition;

      return matchesSearch && matchesCountry && matchesPosition;
    }).sort((a, b) => {
      if (sortOption === 'price-desc') return b.precio - a.precio;
      if (sortOption === 'price-asc') return a.precio - b.precio;
      if (sortOption === 'name-asc') return a.nombre.localeCompare(b.nombre);
      if (sortOption === 'name-desc') return b.nombre.localeCompare(a.nombre);
      return 0;
    });
  }, [searchTerm, filterCountry, sortOption, activeSlot, filterPosition]);

  const handleBuyPlayer = (player: any) => {
    if (!activeSlot) return alert('⚠️ Selecciona primero un hueco vacío.');

    // Identificar si estamos reemplazando a alguien y cuánto vale
    const currentPlayerInSlot =
      activeSlot.type === 'titular'
        ? selected[activeSlot.id]
        : activeSlot.type === 'bench'
        ? bench[activeSlot.id]
        : extras[activeSlot.id];
    const currentSlotValue = currentPlayerInSlot
      ? currentPlayerInSlot.precio
      : 0;

    // 1. BLOQUEO DE 12º JUGADOR (Límite de 11 Titulares)
    if (activeSlot.type === 'titular') {
      const currentTitulars = Object.values(selected).filter(Boolean).length;
      if (currentTitulars >= 11 && !currentPlayerInSlot) {
        return alert(
          '❌ Ya tienes 11 titulares en el campo.\nPara meter a este jugador, primero debes vender a uno de los actuales o moverlo al banquillo.'
        );
      }
    }

    // 2. Comprobar si ya está fichado (en OTRO hueco)
    if (
      allSquadPlayers.find((p) => p.id === player.id) &&
      currentPlayerInSlot?.id !== player.id
    )
      return alert('⚠️ Este jugador ya está en tu equipo.');

    // 3. VALIDACIÓN: Límite de 7 jugadores de la misma selección
    // Excluimos al jugador actual del conteo por si lo estamos sustituyendo
    const otherPlayers = allSquadPlayers.filter(
      (p) => p.id !== currentPlayerInSlot?.id
    );
    const playersFromSameCountry = otherPlayers.filter(
      (p) => p.seleccion === player.seleccion
    ).length;
    if (playersFromSameCountry >= 7) {
      return alert(
        `❌ LÍMITE ALCANZADO:\nNo puedes tener más de 7 jugadores de ${player.seleccion}.`
      );
    }

    // 4. VALIDACIÓN: Presupuesto EFECTIVO
    const effectiveBudget = availableBudget + currentSlotValue;
    const newBudgetSpent = budgetSpent - currentSlotValue + player.precio;

    if (effectiveBudget < player.precio) {
      if (newBudgetSpent > MAX_BUDGET) {
        alert(
          `🚨 AVISO DE PRESUPUESTO:\nHas excedido el límite de ${MAX_BUDGET}M. Debes vender a algún jugador para poder Validar la Plantilla.`
        );
        // No ponemos 'return' aquí para dejarle fichar y que vea la barra roja
      } else {
        return alert('⚠️ Presupuesto insuficiente.');
      }
    }

    // 5. VALIDACIÓN: Posición (Solo para titulares)
    if (activeSlot.type === 'titular' && activeSlot.pos !== player.posicion)
      return alert(
        `⚠️ Posición incorrecta. Este hueco requiere un ${activeSlot.pos}.`
      );

    // ASIGNACIÓN DEL JUGADOR
    const newPlayer = { ...player };
    if (activeSlot.type === 'titular')
      setSelected({ ...selected, [activeSlot.id]: newPlayer });
    else if (activeSlot.type === 'bench')
      setBench({ ...bench, [activeSlot.id]: newPlayer });
    else setExtras({ ...extras, [activeSlot.id]: newPlayer });

    setActiveSlot(null);
  };

  // --- LÓGICA DE TÁCTICA Y VALIDACIÓN ---
  const formationInfo = useMemo(() => {
    const titulars = Object.values(selected).filter(Boolean);
    const count = titulars.length;

    // Contamos por posición
    const def = titulars.filter((p: any) => p.posicion === 'DEF').length;
    const med = titulars.filter((p: any) => p.posicion === 'MED').length;
    const del = titulars.filter((p: any) => p.posicion === 'DEL').length;
    const por = titulars.filter((p: any) => p.posicion === 'POR').length;

    const tacticString = `${def}-${med}-${del}`;

    // Tácticas permitidas en el fútbol moderno
    const validTactics = [
      '4-4-2',
      '4-3-3',
      '3-4-3',
      '3-5-2',
      '5-3-2',
      '5-4-1',
      '4-5-1',
    ];

    const isComplete = count === 11;
    const hasPortero = por === 1;
    const isValidTactic =
      validTactics.includes(tacticString) && isComplete && hasPortero;

    // Determinamos el color y el mensaje
    let statusColor = 'text-white/30'; // Gris (Incompleta)
    let message = 'Formando equipo... (Máx 11)';

    if (count > 11) {
      statusColor = 'text-red-500 animate-pulse';
      message = '⚠️ ¡Demasiados jugadores! Máximo 11 titulares';
    } else if (isComplete) {
      if (!hasPortero) {
        statusColor = 'text-red-500';
        message = '⚠️ Falta un portero en el 11 titular';
      } else if (!validTactics.includes(tacticString)) {
        statusColor = 'text-red-500';
        message = `⚠️ Táctica ${tacticString} no permitida`;
      } else {
        statusColor = 'text-[#22c55e] shadow-green-500/20';
        message = `✅ Táctica ${tacticString} lista para validar`;
      }
    }

    return { tacticString, isValidTactic, statusColor, message, count };
  }, [selected]);

  const handleSellPlayer = () => {
    if (!activeSlot) return;
    if (activeSlot.type === 'titular') {
      const newObj = { ...selected };
      delete newObj[activeSlot.id];
      setSelected(newObj);
      if (captain === selected[activeSlot.id]?.id) setCaptain(null);
    } else if (activeSlot.type === 'bench') {
      const newObj = { ...bench };
      delete newObj[activeSlot.id];
      setBench(newObj);
    } else {
      const newObj = { ...extras };
      delete newObj[activeSlot.id];
      setExtras(newObj);
    }
    setActiveSlot(null);
  };

  const navItems = [
    { id: 'rules', label: 'REGLAS', icon: '📖' },
    { id: 'squad', label: 'PLANTILLA', icon: '📋' },
    { id: 'quiniela', label: 'QUINIELA', icon: '🏆' },
    { id: 'calendar', label: 'CALENDARIO', icon: '📅' },
    { id: 'lineups', label: 'ALINEACIONES', icon: '👕' },
    { id: 'scores', label: 'PUNTOS', icon: '⭐' },
    { id: 'admin', label: 'MODO DIOS', icon: '⚙️' },
  ];

  const visibleNavItems = navItems.filter((item) => {
    // Aquí bloqueamos el Modo Dios para todos excepto para el jefe
    if (item.id === 'admin') return user?.email === 'admin@mundial2026.com';
    return true;
  });

  // --- EL PORTERO (Guardia de sesión) ---
  if (!session) {
    return <AuthScreen onLoginSuccess={(userData: any) => setSession(userData)} />;
  }

  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans selection:bg-[#22c55e] selection:text-black pb-24">
      <header className="bg-[#0a101f] border-b border-white/10 p-4 sticky top-0 z-50 shadow-xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black italic text-[#22c55e] uppercase tracking-tighter leading-none">
              MUNDIAL
            </h1>
            <h2 className="text-sm font-black italic text-white/80 uppercase tracking-widest leading-none">
              Fantástico 2026
            </h2>
          </div>
          
          {/* BOTÓN LOG OUT */}
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 border border-red-500/30 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg text-white active:scale-95"
          >
            LOG OUT
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>

          <div className="text-right">
            <div className="text-xs font-bold text-white/50 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {user ? user.teamName : 'No conectado'}
            </div>
            {isAdmin && (
              <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 rounded uppercase font-black">
                Admin Mode
              </span>
            )}
          </div>
        </div>

        <nav className="max-w-4xl mx-auto mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* USAMOS visibleNavItems PARA OCULTAR EL MODO DIOS AL RESTO */}
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                view === item.id
                  ? 'bg-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <span className="text-sm">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-4 relative">
        {view === 'squad' && (
          <>
            {/* 1. EL CAMPO, EL BANQUILLO Y LA GRADA */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* CABECERA */}
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col gap-3">
                  {/* Nombre y Lápiz */}
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black italic uppercase leading-none text-white">
                      {user.teamName}
                    </h2>
                    <button
                      onClick={() => {
                        const newName = prompt(
                          'Introduce el nuevo nombre para tu equipo:',
                          user.teamName
                        );
                        if (newName && newName.trim() !== '') {
                          const updatedUser = {
                            ...user,
                            teamName: newName.trim().toUpperCase(),
                          };
                          setUser(updatedUser);
                          localStorage.setItem(
                            'ef24_teamName',
                            updatedUser.teamName
                          );
                        }
                      }}
                      className="text-white/30 hover:text-[#22c55e] transition-colors text-lg active:scale-95"
                      title="Editar nombre del equipo"
                    >
                      ✏️
                    </button>
                  </div>

                  {/* Botón Validar y Táctica */}
                  <button
                    onClick={() => {
                      if (!isSquadLocked && !formationInfo.isValidTactic) {
                        return alert(formationInfo.message);
                      }

                      const nextLockState = !isSquadLocked;
                      setIsSquadLocked(nextLockState);

                      if (nextLockState === true) {
                        saveSquadToSupabase();
                      }

                      setActiveSlot(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg border-2 flex items-center justify-center gap-2 ${
                      isSquadLocked
                        ? 'bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                        : formationInfo.isValidTactic
                        ? 'bg-[#22c55e] text-black border-[#22c55e] hover:brightness-110 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                        : 'bg-gray-600 text-white/50 border-white/10 cursor-not-allowed'
                    }`}
                  >
                    {isSquadLocked
                      ? '🔓 Editar Plantilla'
                      : '🔒 Validar Plantilla'}
                  </button>

                  <div
                    className={`mt-2 text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 ${formationInfo.statusColor}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {formationInfo.message}{' '}
                    {formationInfo.count > 0 && `(${formationInfo.count}/11)`}
                  </div>
                </div>

                {/* Presupuesto y Vender */}
                <div className="text-right flex items-center gap-4">
                  {!isSquadLocked &&
                    activeSlot &&
                    (selected[activeSlot.id] ||
                      bench[activeSlot.id] ||
                      extras[activeSlot.id]) && (
                      <button
                        onClick={handleSellPlayer}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase transition-all shadow-lg animate-pulse border-2 border-red-400"
                      >
                        Vender
                      </button>
                    )}

                  <div className="w-32 sm:w-48">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className="text-[10px] text-white/50 font-bold uppercase">
                        Presupuesto
                      </p>
                      <p
                        className={`text-sm font-black ${
                          isBudgetLow ? 'text-red-400' : 'text-[#22c55e]'
                        }`}
                      >
                        {budgetSpent} / {MAX_BUDGET}M
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBudgetColorClass()}`}
                        style={{ width: `${budgetPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CAMPO DE FÚTBOL */}
              <Field
                selected={selected}
                step={step}
                canInteractField={
                  (!isTutorialActive || tutorialStep >= 1) && !isSquadLocked
                }
                activeSlot={activeSlot}
                setActiveSlot={setActiveSlot}
                captain={captain}
                setCaptain={(id: any) => {
                  if (isSquadLocked) return;
                  setCaptain(id);
                  if (tutorialStep === 2) nextStep();
                }}
              />

              {/* BANQUILLO Y GRADA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                  <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-white/50 mb-3">
                    Banquillo Oficial
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((id) => (
                      <BenchCard
                        key={id}
                        id={id}
                        player={bench[id]}
                        isActive={activeSlot?.id === id}
                        onClick={() =>
                          !isSquadLocked &&
                          setActiveSlot({
                            id,
                            type: 'bench',
                            pos: bench[id]?.posicion,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
                  <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-white/50 mb-3">
                    No Convocados (Grada)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['NC1', 'NC2', 'NC3', 'NC4'].map((id) => (
                      <BenchCard
                        key={id}
                        id={id}
                        player={extras[id]}
                        isActive={activeSlot?.id === id}
                        onClick={() =>
                          !isSquadLocked &&
                          setActiveSlot({
                            id,
                            type: 'extras',
                            pos: extras[id]?.posicion,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. EL NUEVO MERCADO FLOTANTE */}
            {activeSlot && (
              <div className="fixed inset-0 z-[80] bg-[#05080f]/95 backdrop-blur-md p-4 flex flex-col animate-in zoom-in-95 duration-200">
                <div className="max-w-md w-full mx-auto flex flex-col h-full pt-16 pb-20">
                  <div className="flex justify-between items-center mb-4 bg-[#1a0b0b] p-4 rounded-2xl border-2 border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                    <div>
                      <h3 className="text-xl font-black italic text-[#22c55e] uppercase">
                        Mercado
                      </h3>
                      <p className="text-xs text-white/60 font-bold uppercase">
                        Para hueco:{' '}
                        <span className="text-white">
                          {activeSlot.type === 'titular'
                            ? activeSlot.pos
                            : 'Banquillo / Grada'}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(selected[activeSlot.id] ||
                        bench[activeSlot.id] ||
                        extras[activeSlot.id]) && (
                        <button
                          onClick={() => {
                            handleSellPlayer();
                          }}
                          className="bg-red-500/20 text-red-500 border border-red-500/50 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-black transition-all"
                        >
                          Vaciar Hueco
                        </button>
                      )}
                      <button
                        onClick={() => setActiveSlot(null)}
                        className="bg-white/10 text-white border border-white/20 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl hover:bg-white hover:text-black transition-all active:scale-95"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 shrink-0 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-sm text-white focus:border-[#22c55e] outline-none transition-colors placeholder:text-white/30"
                    />
                    <div className="flex flex-wrap gap-2">
                      {activeSlot.type !== 'titular' && (
                        <select
                          value={filterPosition}
                          onChange={(e) => setFilterPosition(e.target.value)}
                          className="flex-1 min-w-[90px] bg-black/50 border border-white/20 rounded-lg p-2 text-[10px] font-bold text-white outline-none focus:border-[#22c55e] cursor-pointer"
                        >
                          <option value="TODAS">Posición</option>
                          <option value="POR">Porteros</option>
                          <option value="DEF">Defensas</option>
                          <option value="MED">Medios</option>
                          <option value="DEL">Delanteros</option>
                        </select>
                      )}
                      <select
                        value={filterCountry}
                        onChange={(e) => setFilterCountry(e.target.value)}
                        className="flex-1 min-w-[100px] bg-black/50 border border-white/20 rounded-lg p-2 text-[10px] font-bold text-white outline-none focus:border-[#22c55e] cursor-pointer"
                      >
                        {availableCountriesWithCount.map((c: string) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="flex-1 min-w-[110px] bg-black/50 border border-white/20 rounded-lg p-2 text-[10px] font-bold text-white outline-none focus:border-[#22c55e] cursor-pointer"
                      >
                        <option value="price-asc">Menor Precio</option>
                        <option value="price-desc">Mayor Precio</option>
                        <option value="name-asc">Nombre A - Z</option>
                        <option value="name-desc">Nombre Z - A</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pb-4 scrollbar-hide">
                    {filteredAndSortedPlayers.length > 0 ? (
                      filteredAndSortedPlayers.map((p: any) => {
                        const currentPlayer =
                          activeSlot.type === 'titular'
                            ? selected[activeSlot.id]
                            : activeSlot.type === 'bench'
                            ? bench[activeSlot.id]
                            : extras[activeSlot.id];
                        const isCurrentPlayer = currentPlayer?.id === p.id;
                        const isAlreadyOwned = allSquadPlayers.find(
                          (owned) => owned.id === p.id
                        );

                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between bg-black/40 border p-3 rounded-xl transition-colors ${
                              isAlreadyOwned && !isCurrentPlayer
                                ? 'opacity-50 border-white/5'
                                : 'border-white/10 hover:border-[#22c55e]'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-black text-sm uppercase">
                                {p.nombre}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                    posColors[p.posicion] ||
                                    'bg-gray-500 text-white'
                                  }`}
                                >
                                  {p.posicion}
                                </span>
                                <span className="text-[10px] text-white/50">
                                  {p.seleccion}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-white font-black text-sm">
                                {p.precio}M
                              </span>
                              <button
                                onClick={() => handleBuyPlayer(p)}
                                disabled={!!isAlreadyOwned && !isCurrentPlayer}
                                className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-transform ${
                                  isAlreadyOwned && !isCurrentPlayer
                                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                    : 'bg-[#22c55e] text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                }`}
                              >
                                {isCurrentPlayer
                                  ? 'Actual'
                                  : isAlreadyOwned
                                  ? 'Fichado'
                                  : 'Fichar'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-white/40 text-xs font-bold uppercase mt-10 bg-white/5 p-6 rounded-2xl border border-white/5">
                        No hay jugadores que coincidan con la búsqueda.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {view === 'rules' && <FixedRulesView />}
        {view === 'quiniela' && <QuinielaView user={user} />}
        {view === 'calendar' && <CalendarView />}
        {view === 'lineups' && (
          <div className="p-8 border border-white/10 rounded-2xl text-center text-white/40 bg-white/5">
            👕 Alineaciones en construcción...
          </div>
        )}
        {view === 'scores' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto space-y-3">
    {/* CABECERA DEL RANKING */}
    <div className="flex justify-between items-center px-4 mb-2">
      <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#22c55e]">
        Ranking Mundial 2026
      </h2>
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
        Total {allProfiles.length} Equipos
      </span>
    </div>

    {/* LISTADO DE EQUIPOS ESTILO CARTA */}
    <div className="flex flex-col gap-3">
      {allProfiles.length > 0 ? (
        [...allProfiles]
          .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
          .map((p, index) => {
            // Lógica de colores para las posiciones
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;
            
            const posColor = isFirst ? 'text-yellow-500' : 
                             isSecond ? 'text-gray-300' : 
                             isThird ? 'text-[#cd7f32]' : // Bronce
                             'text-gray-500';

            return (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-5 rounded-[2rem] transition-all bg-[#0a101f] border border-white/5 hover:border-white/10 ${
                  p.id === user.id ? 'ring-2 ring-[#22c55e]/30 bg-[#0d1629]' : ''
                }`}
              >
                {/* POSICIÓN Y NOMBRE */}
                <div className="flex items-center gap-5">
                  <span className={`text-3xl font-black italic min-w-[3rem] ${posColor}`}>
                    #{index + 1}
                  </span>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="font-black uppercase text-base italic text-white tracking-tight">
                        {p.team_name || 'Sin Equipo'}
                      </span>
                      {/* MONEDA DE 5€ MÁS GRANDE */}
                      {p.has_paid && (
                        <div 
                          className="flex items-center justify-center w-7 h-7 bg-yellow-500 rounded-full border-2 border-black/20 shadow-[0_0_15px_rgba(234,179,8,0.4)] shrink-0"
                          title="Apuesta de 5€ Realizada"
                        >
                          <span className="text-[10px] font-black text-black">5€</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-tighter">
                      👤 {p.username}
                    </span>
                  </div>
                </div>

                {/* PUNTOS Y DETALLES */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#22c55e] italic leading-none">
                      {p.total_points || 0} <span className="text-xs ml-0.5">PTS</span>
                    </span>
                  </div>
                  {/* Icono de flecha como en tu imagen */}
                  <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            );
          })
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-white/20 font-black uppercase text-sm">
          Calculando clasificaciones...
        </div>
      )}
    </div>
  </div>
)}

        {view === 'admin' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto space-y-6">
    
    {/* --- NUEVA SUB-NAVEGACIÓN DE TESORERÍA --- */}
    <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-2xl max-w-md mx-auto mb-6">
      {['puntos', 'partidos', 'tesoreria'].map((tab) => (
        <button
          key={tab}
          onClick={() => setAdminTab(tab as any)}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
            adminTab === tab ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:bg-white/5'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

    {/* ==========================================
        PESTAÑA: PARTIDOS (MERCADO + MARCADORES)
        ========================================== */}
    {adminTab === 'partidos' && (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* CABECERA Y MERCADO (Tu código original) */}
        <div className="bg-[#1a0b0b] border border-red-500/30 rounded-3xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden text-left">
          <h2 className="text-2xl font-black italic text-red-500 uppercase tracking-tighter mb-6 flex items-center gap-2">
            <span>MODO DIOS</span>
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full not-italic">Admin</span>
          </h2>
          {/* Aquí va tu bloque de Estado del Mercado y Jornada Activa... */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-black text-white/70 uppercase mb-4">Estado del Mercado</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isMarketOpen ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`}></div>
                <span className="font-bold text-sm uppercase">{isMarketOpen ? 'Mercado Abierto' : 'Mercado Cerrado'}</span>
              </div>
              <button onClick={toggleMarket} className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-lg ${isMarketOpen ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {isMarketOpen ? 'Cerrar Mercado' : 'Abrir Mercado'}
              </button>
            </div>
          </div>
          {/* Bloque Jornada Activa */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-black text-white/70 uppercase mb-4 flex justify-between">
              <span>Jornada Activa</span>
              <span className="text-red-400">{activeMatchday}</span>
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {['J1', 'J2', 'J3', 'D16', 'OCT', 'CUA', 'SEM', 'FIN'].map((j) => (
                <button key={j} onClick={() => changeMatchday(j)} className={`py-3 rounded-xl text-xs font-black transition-colors border border-transparent ${activeMatchday === j ? 'bg-red-500/20 text-white border-red-500' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                  {j}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* INYECTAR MARCADORES (Tu código original) */}
        <div className="bg-[#1a0b0b] border border-red-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
          <h2 className="text-xl font-black italic text-red-500 uppercase tracking-tighter mb-4">Inyectar Marcadores</h2>
          <select value={adminScoreCountry.length > 1 ? 'A' : adminScoreCountry} onChange={(e) => setAdminScoreCountry(e.target.value)} className="w-full bg-black/50 border border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold text-white mb-6 focus:border-red-500 outline-none">
            {GROUPS_2026.map((g) => (<option key={g.id} value={g.id}>GRUPO {g.id}</option>))}
          </select>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const group = GROUPS_2026.find(g => g.id === (adminScoreCountry.length > 1 ? 'A' : adminScoreCountry));
              if (!group) return null;
              const order = [[0, 1], [2, 3], [0, 2], [3, 1], [3, 0], [1, 2]];
              const home = group.teams[order[num - 1][0]];
              const away = group.teams[order[num - 1][1]];
              const mId = `G_${group.id}_${num}`;
              return (
                <MatchAdminRow key={mId} match={{id: mId, home, away, home_score: results[mId]?.home_score, away_score: results[mId]?.away_score}}
                  onSave={async (id: string, hs: number, as: number) => {
                    const { error } = await supabase.from('match_results').upsert({ match_id: id, group_id: group.id, home_score: hs, away_score: as });
                    if (!error) {
                      const { data } = await supabase.from('match_results').select('*');
                      const map: any = {};
                      data?.forEach((r) => (map[r.match_id] = r));
                      setResults(map);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    )}

    {/* ==========================================
        PESTAÑA: PUNTOS (INYECTAR PUNTOS JUGADORES)
        ========================================== */}
    {adminTab === 'puntos' && (
      <div className="animate-in fade-in duration-300">
        <div className="bg-[#1a0b0b] border border-red-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
          <h2 className="text-xl font-black italic text-red-500 uppercase tracking-tighter mb-4">Inyectar Puntos Jugadores</h2>
          <div className="mb-6">
            <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-2 block">1. Elegir Selección Nacional</label>
            <select value={adminScoreCountry} onChange={(e) => setAdminScoreCountry(e.target.value)} className="w-full bg-black/50 border border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-red-500 cursor-pointer">
              {availableCountries.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          {adminScoreCountry !== 'SELECCIÓN' && (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {PLAYERS_DB.filter(p => p.seleccion === adminScoreCountry).map((p) => (
                <PlayerAdminRow key={p.id} p={p} savedScore={scores[p.id]} onScoreSaved={handleScoreSaved} adminMatchday={activeMatchday} isMatchdayClosed={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    {/* ==========================================
        PESTAÑA: TESORERÍA (CONTROL DE PAGOS)
        ========================================== */}
    {adminTab === 'tesoreria' && (
      <div className="animate-in fade-in duration-300 space-y-4 text-left">
        <div className="bg-[#1a0b0b] border border-red-500/30 rounded-3xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black italic text-red-500 uppercase">Tesorería</h2>
            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Control de Pagos</div>
          </div>
          
          <div className="space-y-3">
            {allProfiles.length > 0 ? (
              allProfiles.map((p) => (
                <div key={p.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-white uppercase text-sm italic">{p.team_name || 'Sin Equipo'}</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">👤 {p.username}</p>
                  </div>
                  <button
                    onClick={() => togglePayment(p.id, p.has_paid)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                      p.has_paid 
                        ? 'bg-yellow-500 text-black border-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                        : 'bg-white/5 text-white/20 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {p.has_paid ? '✓ Pagado' : '✕ Sin Apuesta'}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/20 font-bold uppercase text-xs">Cargando tesorería...</div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)}
      </main>

      {/* NUEVO BOTÓN DE AYUDA (Abajo a la derecha, verde semitransparente) */}
      <button
        onClick={() => setShowSectionHelp(view)}
        className="fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl transition-all shadow-lg bg-[#22c55e]/60 text-black hover:bg-[#22c55e] border border-white/20 backdrop-blur-md hover:scale-105 active:scale-95"
        title="Ayuda de este apartado"
      >
        ?
      </button>

      {/* MODAL DE AYUDA CONTEXTUAL SIMPLE */}
      {showSectionHelp && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a101f] border-2 border-[#22c55e] rounded-3xl p-6 shadow-2xl max-w-xs w-full animate-in zoom-in-95">
            <div className="flex justify-center mb-4">
              <span className="w-12 h-12 bg-[#22c55e]/20 rounded-full flex items-center justify-center text-2xl border border-[#22c55e]/50 text-[#22c55e]">
                ?
              </span>
            </div>
            <h3 className="text-[#22c55e] font-black uppercase text-center text-lg mb-4 tracking-tight">
              Ayuda: {navItems.find((i) => i.id === showSectionHelp)?.label}
            </h3>
            <p className="text-white/80 text-xs mb-6 leading-relaxed text-center font-medium">
              {showSectionHelp === 'rules' &&
                'Aquí puedes consultar cómo puntúan los goles, tarjetas, porterías a cero y otros eventos. Es vital conocerlas para formar un buen equipo.'}
              {showSectionHelp === 'squad' &&
                "Tu plantilla de 21 jugadores. Pulsa 'Editar Plantilla' para hacer cambios. Los 11 titulares puntúan normal, ¡pero el Capitán suma el doble!"}
              {showSectionHelp === 'quiniela' &&
                'Haz tus pronósticos de los grupos. Cada acierto al final de la fase te dará millones extra de presupuesto para futuros fichajes.'}
              {showSectionHelp === 'calendar' &&
                'Consulta los grupos, sedes, fechas y resultados en vivo de todos los partidos del torneo.'}
              {showSectionHelp === 'lineups' &&
                'Aquí podrás retocar tu 11 titular y elegir a tus suplentes para la jornada actual. Se bloquea cuando empiece el primer partido.'}
              {showSectionHelp === 'scores' &&
                'Revisa el rendimiento de tus jugadores jornada a jornada, tu puntuación total y tu posición en el ranking global.'}
              {showSectionHelp === 'admin' &&
                'Panel de control maestro para abrir/cerrar el mercado y gestionar resultados.'}
            </p>
            <button
              onClick={() => setShowSectionHelp(null)}
              className="w-full py-3 bg-[#22c55e] text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-transform"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ASISTENTE FLOTANTE */}
      <TutorialCaddy
        step={tutorialStep}
        active={isTutorialActive}
        onNext={nextStep}
        onClose={handleCloseTutorial}
        userName={user?.username || 'Seleccionador'}
        extrasCount={Object.values(extras || {}).filter(Boolean).length}
        captain={captain} // <-- ¡No olvides esta línea!
      />
    </div>
  );
}

// ==========================================
// 9. TARJETAS DE BANQUILLO Y MERCADO
// ==========================================

const BenchCard = ({ player, id, onClick, isActive }: any) => {
  const posColor = player
    ? posColors[player.posicion]
    : 'bg-white/10 text-white/30';

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-between p-2 rounded-xl border-2 transition-all cursor-pointer ${
        isActive
          ? 'border-white bg-white/20 scale-105 shadow-lg shadow-white/20'
          : 'border-white/10 bg-black/40 hover:bg-white/10'
      } ${!player ? 'border-dashed' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-black ${posColor}`}
        >
          {player ? player.posicion : id}
        </div>
        {player ? (
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase leading-tight truncate w-16">
              {player.nombre.split(' ').pop()}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <img
                src={getFlag(player.seleccion)}
                alt={player.seleccion}
                className="w-3 h-2.5 object-cover rounded shadow-sm"
              />
              <span className="text-[8px] text-[#22c55e] font-black">
                {player.precio}M
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-white/30 font-bold uppercase italic">
            Vacío
          </span>
        )}
      </div>
    </div>
  );
};

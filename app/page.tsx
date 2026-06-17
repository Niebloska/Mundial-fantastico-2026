'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';

import { supabase } from '../lib/supabase';

import { availableCountries } from '../lib/countries';

import confetti from 'canvas-confetti';

import { ALL_MATCHES } from './data/matches';

// app/page.tsx (arriba, junto a los otros imports)
import { ALL_PLAYERS } from './data/players';

// ==========================================
// 1. CONSTANTES GLOBALES Y CONFIGURACIÓN: MUNDIAL 2026
// ==========================================

const ADMIN_EMAIL = 'admin@mundial2026.com';
const GAME_START_DATE = '2026-06-11T21:00:00'; // Fecha del partido inaugural (Ajustado +1h verano)
const SIMULATED_GAME_START = '2026-06-11T21:00:00';
const MAX_BUDGET = 800;

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

const getPlayerUniqueId = (player: any) => {
  return `${player.nombre.trim().toLowerCase()}_${player.equipo.trim().toLowerCase()}`;
};

// Esta función ahora solo hace de "puente" porque tus datos ya están limpios
const getPosCode = (pos: string) => {
  return pos; 
};



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
                {/* BLOQUEO DE CAPITÁN */}
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

            {/* === NUEVO BOTÓN UNIVERSAL: SALTAR TUTORIAL === */}
            {step < 9 && (
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => onClose(true)}
                  className="text-[9px] font-black uppercase text-white/40 hover:text-white underline decoration-white/20 transition-colors"
                >
                  Saltar Tutorial ⏭️
                </button>
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
    teams: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'],
  },
  { name: 'GRUPO B', teams: ['Canadá', 'Bosnia y Herzegovina', 'Qatar', 'Suiza'] },
  { name: 'GRUPO C', teams: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
  { name: 'GRUPO D', teams: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'] },
  {
    name: 'GRUPO E',
    teams: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
  },
  { name: 'GRUPO F', teams: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  { name: 'GRUPO G', teams: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'] },
  {
    name: 'GRUPO H',
    teams: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
  },
  { name: 'GRUPO I', teams: ['Francia', 'Senegal', 'Iraq', 'Noruega'] },
  { name: 'GRUPO J', teams: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  {
    name: 'GRUPO K',
    teams: ['Portugal', 'Congo (RDC)', 'Uzbekistán', 'Colombia'],
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
    'Corea del Sur': 'kr',
    'República Checa': 'cz',
    // Grupo B
    Canadá: 'ca',
    'Bosnia y Herzegovina': 'ba',
    Qatar: 'qa',
    Suiza: 'ch',
    // Grupo C
    Brasil: 'br',
    Marruecos: 'ma',
    Haití: 'ht',
    Escocia: 'gb-sct',
    // Grupo D
    'Estados Unidos': 'us',
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
    'Irán': 'ir',
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
    Jordania: 'jo',
    // Grupo K
    Portugal: 'pt',
    'Congo (RDC)': 'cd',
    Uzbekistán: 'uz',
    Colombia: 'co',
    // Grupo L
    Inglaterra: 'gb-eng',
    Croacia: 'hr',
    Ghana: 'gh',
    Panamá: 'pa',
  };

  const code = flags[team];
  
  if (!code) return '';

  // 🚀 AQUI ESTÁ EL CAMBIO:
  // Construimos la URL original y la pasamos por el proxy de CORS
  const originalUrl = `https://flagcdn.com/w40/${code}.png`;
  return `https://flagcdn.com/w40/${code}.png`;
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
  evaluatedPlayers, // 🧠 NUEVA PROP: Recibe los cálculos de la jornada
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

            // 🛡️ PARCHE DE SEGURIDAD: Inyectamos el ID si falta
            const playerWithId = p ? { ...p, id: p.id || `${p.nombre}_${p.equipo}` } : null;
            const pFinal = playerWithId; // Usaremos esto para todo ahora

            // 🧠 LEEMOS LOS STATS DEL JUGADOR CON TRIM()
            const stats = (p && evaluatedPlayers) 
              ? evaluatedPlayers[`${p.nombre.trim()}_${p.equipo.trim()}`] 
              : null;

            const isSubbedOut = stats?.isSubbedOut; // ¿Se quedó sin jugar?

            const isActive = activeSlot?.id === id && activeSlot?.type === 'titular';
            
            // 🎨 DISEÑO CONDICIONAL: Si no juega, lo ponemos gris y opaco
            const bgClass = p
              ? isSubbedOut 
                ? 'bg-gray-400 border-gray-500 saturate-0 opacity-90' 
                : 'bg-white border-[#22c55e]'
              : 'bg-black/40 border-white/20';

            const highlightClass = isActive
              ? 'bg-white/30 border-white ring-4 ring-white/60 scale-110'
              : canInteractField && !p
              ? 'hover:bg-white/20 hover:border-white ring-4 ring-transparent hover:ring-white/30'
              : '';

              return (
                <div
                  key={i}
                  // 👇 AQUÍ ESTÁ LA MAGIA 3D AÑADIDA A LOS TITULARES
                  className="relative flex flex-col items-center group cursor-pointer transition-all duration-300 hover:z-50 hover:-translate-y-2 hover:scale-110 hover:[transform:perspective(800px)_rotateX(10deg)_rotateY(-10deg)] active:[transform:perspective(800px)_rotateX(-10deg)_rotateY(10deg)_scale(0.95)]"
                  onClick={() =>
                    canInteractField &&
                    setActiveSlot({ id, type: 'titular', pos: row.pos })
                  }
                >
                  <div
                    className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center shadow-xl transition-all relative z-30 ${bgClass} ${highlightClass}`}
                  >
                  {p ? (
                    <span className={`text-[9px] font-black ${isSubbedOut ? 'text-gray-700' : 'text-black'} text-center leading-none uppercase italic`}>
                      {p.nombre.split(' ').pop()}
                    </span>
                  ) : (
                    <div className="text-white/50">
                      <IconPlus />
                    </div>
                  )}

                  {/* ⭐ GLOBO DE PUNTOS (Estilo EF24: Elíptico, borde blanco, texto negro) */}
{stats && stats.points !== undefined && stats.points !== '-' && (
  <div className={`absolute -top-2 -left-3 min-w-[28px] h-[22px] px-2 rounded-full border-[2px] border-white font-black text-[11px] flex items-center justify-center z-50 shadow-lg tracking-tighter
    ${stats.points > 0 ? 'bg-[#22c55e] text-black' : 
      stats.points < 0 ? 'bg-red-500 text-white' : 
      'bg-gray-500 text-white'}`}>
    {stats.points > 0 ? `+${stats.points}` : stats.points}
  </div>
)}

                  {/* 🔄 ICONO DE SUSTITUIDO (Titular que no juega) */}
                  {isSubbedOut && (
                    <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/40 rounded-full pointer-events-none">
                      <span className="text-lg drop-shadow-[0_0_5px_rgba(239,68,68,1)] bg-red-500/20 rounded-full p-0.5">🔻</span>
                    </div>
                  )}

                  {/* © CAPITÁN (Arriba Derecha) */}
                  {p && step >= 2 && (
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canInteractField) setCaptain(pFinal.id);
                    }}
                      className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 font-black text-[9px] flex items-center justify-center transition-all z-50 ${
                        (captain && captain === pFinal.id)
                          ? 'bg-[#facc15] text-black border-white scale-110 shadow-lg'
                          : 'bg-black/60 text-white/30 border-white/10 hover:bg-black/80 hover:text-white'
                      }`}
                    >
                      {(captain && captain === pFinal.id) ? <IconCheck /> : 'C'}
                    </button>
                  )}

                  {/* VALOR DEL JUGADOR */}
                  {p && (
                    <PlayerValueBadge
                      value={p.precio}
                      className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-40 ${isSubbedOut ? 'opacity-50' : ''}`}
                    />
                  )}
                </div>

                {/* BANDERA DEL PAÍS */}
                {p && (
                  <img
                    src={getFlag(p.equipo)}
                    alt={p.equipo}
                    className={`mt-1 w-8 h-6 object-cover rounded shadow-black drop-shadow-lg z-20 transition-all ${isSubbedOut ? 'saturate-0 opacity-50' : ''}`}
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
                <strong className="text-yellow-400 text-lg">800M</strong>{' '}
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
                  Presupuesto inicial de <strong>800M</strong> aumentará con los
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
              24 aciertos <span className="block text-lg">200 M</span>
            </div>
            <div className="bg-[#06b6d4] text-black p-3 rounded-lg shadow-md border border-white/5">
              18 aciertos <span className="block text-lg">60 M</span>
            </div>

            <div className="bg-[#f59e0b] text-black p-3 rounded-lg shadow-md border border-white/5">
              23 aciertos <span className="block text-lg">150 M</span>
            </div>
            <div className="bg-[#3b82f6] text-white p-3 rounded-lg shadow-md border border-white/5">
              16 aciertos <span className="block text-lg">50 M</span>
            </div>

            <div className="bg-[#eab308] text-black p-3 rounded-lg shadow-md border border-white/5">
              22 aciertos <span className="block text-lg">120 M</span>
            </div>
            <div className="bg-[#84cc16] text-black p-3 rounded-lg shadow-md border border-white/5">
              14 aciertos <span className="block text-lg">40 M</span>
            </div>

            <div className="bg-[#10b981] text-white p-3 rounded-lg shadow-md border border-white/5">
              21 aciertos <span className="block text-lg">90 M</span>
            </div>
            <div className="bg-gray-500 text-white p-3 rounded-lg shadow-md border border-white/5">
              12 aciertos <span className="block text-lg">30 M</span>
            </div>

            <div className="bg-[#059669] text-white p-3 rounded-lg shadow-md border border-white/5">
              20 aciertos <span className="block text-lg">70 M</span>
            </div>
            <div className="bg-gray-700 text-white/70 p-3 rounded-lg shadow-md border border-white/5">
              10 aciertos <span className="block text-lg">20 M</span>
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

const MatchAdminRow = ({ match, onSave, onDelete }: any) => {
  const [hScore, setHScore] = useState<number | ''>(match.home_score ?? '');
  const [aScore, setAScore] = useState<number | ''>(match.away_score ?? '');

  // 👇 Añade este efecto debajo de tus useState
  useEffect(() => {
    setHScore(match.home_score ?? '');
    setAScore(match.away_score ?? '');
  }, [match.home_score, match.away_score]); // Se ejecutará cada vez que el padre cambie estos valores

  // Comprobamos si hay algún marcador escrito (ya sea guardado o en el input)
  const hasAnyScore = hScore !== '' || aScore !== '';

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

      {/* Botones de acción */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onSave(match.id, hScore, aScore)}
          className="bg-[#22c55e]/20 text-[#22c55e] p-2 rounded hover:bg-[#22c55e]/40 transition-colors"
          title="Guardar resultado"
        >
          💾
        </button>

        {/* 👇 LA PAPELERA: Ahora aparece siempre que haya números en el marcador 👇 */}
        {hasAnyScore && (
          <button
            onClick={async () => {
              if (confirm(`¿Seguro que quieres resetear el partido ${match.home} vs ${match.away} y dejarlo vacío?`)) {
                if (onDelete) await onDelete(match.id);
                setHScore(''); // Vacía el input local
                setAScore(''); // Vacía el input local
              }
            }}
            className="bg-red-500/20 text-red-400 p-2 rounded hover:bg-red-500 hover:text-white transition-colors"
            title="Borrar resultado de la base de datos"
          >
            🗑️
          </button>
        )}
      </div>
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

  // Añade esto a tus estados globales arriba del todo (donde tienes el resto de estados)
const [lineupsHistory, setLineupsHistory] = useState<Record<string, any>>({}); 
// Ejemplo de estructura: { "J1": { selected: {...}, bench: {...} }, "J2": {...} }

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

    // 💡 SOLUCIÓN: Generamos un ID seguro combinando nombre y equipo si p.id no existe
    const safePlayerId = p.id || `${p.nombre}_${p.equipo}`;

    const { error } = await supabase
      .from('player_scores')
      .upsert(
        { player_id: safePlayerId, matchday: adminMatchday, points: finalValue },
        { onConflict: 'player_id, matchday' }
      );

    if (!error) {
      onScoreSaved(safePlayerId, finalValue);
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
            src={getFlag(p.equipo)}
            alt={p.equipo}
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
  { id: 'A', teams: ['México', 'Sudáfrica', 'Corea del Sur', 'República Checa'] },
  { id: 'B', teams: ['Canadá', 'Bosnia y Herzegovina', 'Qatar', 'Suiza'] },
  { id: 'C', teams: ['Brasil', 'Marruecos', 'Haití', 'Escocia'] },
  { id: 'D', teams: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'] },
  { id: 'E', teams: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'] },
  { id: 'F', teams: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'] },
  { id: 'G', teams: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'] },
  { id: 'H', teams: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'] },
  { id: 'I', teams: ['Francia', 'Senegal', 'Iraq', 'Noruega'] },
  { id: 'J', teams: ['Argentina', 'Argelia', 'Austria', 'Jordania'] },
  { id: 'K', teams: ['Portugal', 'Congo (RDC)', 'Uzbekistán', 'Colombia'] },
  { id: 'L', teams: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'] },
];

const PRIZE_SCALE = [
  { hits: 24, prize: 200, color: '#ea580c' }, // Naranja fuerte
  { hits: 23, prize: 150, color: '#f59e0b' }, // Naranja claro/Ámbar
  { hits: 22, prize: 120, color: '#eab308' }, // Amarillo
  { hits: 21, prize: 90, color: '#10b981' }, // Verde esmeralda
  { hits: 20, prize: 70, color: '#059669' }, // Verde oscuro
  { hits: 18, prize: 60, color: '#06b6d4' }, // Cian
  { hits: 16, prize: 50, color: '#3b82f6' }, // Azul
  { hits: 14, prize: 40, color: '#84cc16' }, // Verde lima
  { hits: 12, prize: 30, color: '#6b7280' }, // Gris medio
  { hits: 10, prize: 20, color: '#4b5563' }, // Gris oscuro
];

const QuinielaView = ({ user, setHasUnsavedQuiniela }: { user: any, setHasUnsavedQuiniela?: any }) => {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 👇 2. NUEVO: Enviamos la señal por el cable en tiempo real al vigilante principal
  useEffect(() => {
    if (setHasUnsavedQuiniela) {
      // Si la app ya ha cargado los datos y isSaved es false (está editando), bloqueamos las salidas.
      setHasUnsavedQuiniela(!isLoading && !isSaved);
    }
  }, [isSaved, isLoading, setHasUnsavedQuiniela]);

  
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
          // 🔥 EL EXORCISMO: Filtramos la base de datos para borrar equipos fantasma
          const allValidTeams = GROUPS_2026.flatMap(g => g.teams);
          const cleanSelections: Record<string, string[]> = {};
          
          Object.keys(data.selections).forEach(groupId => {
            cleanSelections[groupId] = data.selections[groupId].filter((team: string) => 
              allValidTeams.includes(team)
            );
          });

          setSelections(cleanSelections);
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

    // 🎉 EXPLOSIÓN DE CONFETI PARA LA QUINIELA
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#06b6d4', '#ffffff'] // Azul cyan y blanco para diferenciar de la plantilla
    });
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
        
        {/* === NUEVO ENCABEZADO Y BOTÓN REUBICADO === */}
<div className="flex items-center justify-between gap-4 mb-6 max-w-3xl mx-auto">
  <h1 className="text-3xl font-black italic text-[#22c55e] uppercase tracking-tighter leading-none">
    🏆 QUINIELA
  </h1>
  {/* El botón ya no está aquí dentro */}
</div>

{/* === BOTÓN FLOTANTE (Posicionado arriba a la derecha) === */}
<div className="fixed top-40 right-4 z-[9999]">
  <button
    onClick={() => alert("⛔ ¡El balón ya está rodando! La Quiniela está cerrada y los pronósticos son definitivos.")}
    className="px-4 py-2 bg-gray-600 text-white/50 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg border-2 border-white/10 cursor-not-allowed"
  >
    🔒 Quiniela Cerrada
  </button>
</div>
        
  
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
    </div>
  );
};

// ==========================================
// 9. VISTA DE CALENDARIO, GRUPOS Y ELIMINATORIAS (FECHA VERDE / HORA AMARILLA)
// ==========================================

// Helper para evitar problemas con las zonas horarias del navegador
const formatMatchDate = (isoString: string) => {
  const [datePart, timePart] = isoString.split('T');
  const [, month, day] = datePart.split('-');
  const time = timePart.substring(0, 5); 
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return { day: `${day} ${months[parseInt(month, 10) - 1]}`, time };
};

const CalendarView = ({ results }: { results: Record<string, any> }) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout'>('groups');
  const [activeGroup, setActiveGroup] = useState('A');
  
  const activeGroupData = GROUPS_2026.find((g) => g.id === activeGroup);

  // Filtramos los partidos exactos de este grupo
  const groupMatches = useMemo(() => {
    if (!activeGroupData) return [];
    
    return ALL_MATCHES.filter(
      (m) => activeGroupData.teams.includes(m.team1) && activeGroupData.teams.includes(m.team2)
    ).map(m => {
      const { day, time } = formatMatchDate(m.date);
      return { ...m, day, time };
    });
  }, [activeGroupData]);

  // Calculamos la clasificación con los partidos reales
  const standings = useMemo(() => {
    if (!activeGroupData) return [];
    let table: any = {};
    activeGroupData.teams.forEach(
      (t) => (table[t] = { name: t, pts: 0, pj: 0, gf: 0, gc: 0, dif: 0 })
    );

    groupMatches.forEach((match, index) => {
      // 🧠 Traductor: Convertimos el índice (0-5) al ID que usa el Modo Dios (1-6)
      const modoDiosId = `G_${activeGroup}_${index + 1}`;
      const res = results[modoDiosId]; // <-- Usamos el ID traducido

      if (res && res.home_score !== null && res.away_score !== null) {
        const homeTeam = match.team1;
        const awayTeam = match.team2;

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
  }, [activeGroupData, groupMatches, results]);

  // Mapeo dinámico de eliminatorias con sus ID oficiales
  const knockoutRounds = [
    { title: 'Dieciseisavos', matches: ALL_MATCHES.filter(m => m.id >= 73 && m.id <= 88) },
    { title: 'Octavos', matches: ALL_MATCHES.filter(m => m.id >= 89 && m.id <= 96) },
    { title: 'Cuartos', matches: ALL_MATCHES.filter(m => m.id >= 97 && m.id <= 100) },
    { title: 'Semifinales', matches: ALL_MATCHES.filter(m => m.id >= 101 && m.id <= 102) },
    { title: 'Tercer Puesto', matches: ALL_MATCHES.filter(m => m.id === 103) },
    { title: 'Final', matches: ALL_MATCHES.filter(m => m.id === 104) },
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
  {groupMatches.map((m, index) => {
    // 🧠 EL TRADUCTOR MAGICO: Convertimos el ID numérico del calendario al ID 'G_X_Y' del Modo Dios.
    // Como groupMatches siempre tiene 6 partidos por grupo, usamos el index (del 0 al 5) para generar el sufijo (del 1 al 6).
    const modoDiosId = `G_${activeGroup}_${index + 1}`;

    return (
      <div
        key={m.id}
        className="bg-[#0a101f] border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-white/10 transition-all shadow-md relative"
      >
        <div className="absolute top-2 left-3 text-[7px] font-black text-white/20 uppercase tracking-widest">
          P{m.id}
        </div>
        <div className="flex flex-col items-center gap-1 w-1/3">
          <img
            src={getFlag(m.team1)}
            className="w-8 h-5 object-cover rounded-sm"
          />
          <span className="text-[10px] font-black uppercase text-center text-white/90">
            {m.team1}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="bg-black/60 px-4 py-1.5 rounded-lg text-lg font-black text-white border border-white/10 shadow-inner group-hover:text-[#22c55e] transition-colors tabular-nums">
            {/* 👇 AQUÍ USAMOS EL ID TRADUCIDO */}
            {results[modoDiosId]?.home_score ?? '-'} :{' '}
            {results[modoDiosId]?.away_score ?? '-'}
          </div>
          <div className="flex flex-col items-center mt-1.5 space-y-0.5">
            <span className="text-[10px] text-[#22c55e] font-black uppercase tracking-wide drop-shadow-[0_0_2px_rgba(34,197,94,0.3)]">
              {m.day}
            </span>
            <span className="text-[11px] text-[#eab308] font-black uppercase tracking-tight drop-shadow-[0_0_2px_rgba(234,179,8,0.3)]">
              {m.time} h
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 w-1/3">
          <img
            src={getFlag(m.team2)}
            className="w-8 h-5 object-cover rounded-sm"
          />
          <span className="text-[10px] font-black uppercase text-center text-white/90">
            {m.team2}
          </span>
        </div>
      </div>
    );
  })}
</div>
        </>
      ) : (
        <div className="flex flex-col gap-10 py-4">
          {knockoutRounds.map((round, rIdx) => (
            <div key={rIdx} className="space-y-6">
              <h3 className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-[#22c55e] opacity-60 flex items-center justify-center gap-4">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#22c55e]/30"></span>
                {round.title}
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#22c55e]/30"></span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4">
                {round.matches.map((match) => {
                  const { day, time } = formatMatchDate(match.date);
                  
                  return (
                    <div
                      key={match.id}
                      className="bg-[#0a101f] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center relative shadow-xl hover:border-white/10 transition-all pt-5"
                    >
                      <div className="flex w-full justify-around items-center">
                        <div className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-tighter w-24 text-center truncate">
                          {match.team1}
                        </div>
                        <div className="flex flex-col items-center justify-center mx-2">
                          <span className={`text-base sm:text-lg font-black ${results[match.id] ? 'text-[#22c55e]' : 'text-white/20'}`}>
                            {results[match.id] ? `${results[match.id].home_score} - ${results[match.id].away_score}` : 'VS'}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-tighter w-24 text-center truncate">
                          {match.team2}
                        </div>
                      </div>
                      {/* 👇 CAMBIO: Cápsula con P(ID) en gris, Día en verde, Hora en amarillo */}
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black px-4 py-1.5 rounded-full border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest shadow-lg whitespace-nowrap flex items-center gap-1.5">
                        <span>P{match.id}</span> 
                        <span className="text-white/20">•</span> 
                        <span className="text-[#22c55e] text-[10px] font-black tracking-normal">{day}</span> 
                        <span className="text-[#eab308] text-[11px] font-black tracking-normal">{time} h</span>
                      </div>
                    </div>
                  );
                })}
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
            Mundial Fantástico Edition
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

const JORNADAS_DEADLINES = [
  { id: 'J1', label: 'EL MUNDIAL', date: new Date('2026-06-11T21:00:00+02:00').getTime() },
  { id: 'J2', label: 'ALINEACIÓN J2', date: new Date('2026-06-18T16:00:00+02:00').getTime() },
  { id: 'J3', label: 'ALINEACIÓN J3', date: new Date('2026-06-24T16:00:00+02:00').getTime() },
  { id: 'D16', label: 'DIECISEISAVOS', date: new Date('2026-06-28T19:00:00+02:00').getTime() },
  { id: 'OCT', label: 'OCTAVOS', date: new Date('2026-07-04T19:00:00+02:00').getTime() },
  { id: 'CUA', label: 'CUARTOS', date: new Date('2026-07-09T19:00:00+02:00').getTime() },
  { id: 'SEM', label: 'SEMIFINALES', date: new Date('2026-07-14T21:00:00+02:00').getTime() },
  { id: 'FIN', label: 'LA FINAL', date: new Date('2026-07-18T23:00:00+02:00').getTime() }
];

// ==========================================
// 9. APP PRINCIPAL: INTERFAZ Y ESTADOS GLOBALES
// ==========================================

export default function MundialApp() {
  
  // --- RELOJ MAESTRO DEL MUNDIAL ---
  const [countdown, setCountdown] = useState({
    d: 0, h: 0, m: 0, s: 0,
    targetName: 'EL MUNDIAL',
    targetId: 'J1',
    expired: false
  });

  const [lineupsMatchday, setLineupsMatchday] = useState('J1');

  const [isEditingLineup, setIsEditingLineup] = useState(false);

  // Añade esto al inicio de tu componente Page
const cleanKey = (str: string) => {
  if (!str) return "";
  return str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

  // 🛡️ LOCK DE SEGURIDAD ABSOLUTA: Bloquea físicamente el auto-guardado en el arranque
const isInitialLoadComplete = useRef(false);

  // Estados para Intro y Música
  const [showWelcome, setShowWelcome] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 🧠 NUEVOS ESTADOS: Control de la precarga
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const playlist = ['/audio/tema1.mp3', '/audio/tema2.mp3'];

  const [hasUnsavedQuiniela, setHasUnsavedQuiniela] = useState(false);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // 💸 ESTADOS DEL MERCADO DE FICHAJES
  const [snapshotSquad, setSnapshotSquad] = useState<any>(null); // Aquí guardaremos la "Foto"
  const [transfersMade, setTransfersMade] = useState(0); // Contador de fichajes (Máx 6)
  const [currentBudget, setCurrentBudget] = useState(0); // Dinero disponible
  const [quinielaPrize, setQuinielaPrize] = useState(0); // El premio obtenido en la quiniela

  // 🧠 NUEVO EFECTO: Simulador de carga inteligente
  // Da tiempo al navegador a cachear el vídeo (2-3 segundos) con una barra de progreso visual
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      // Sube de forma aleatoria entre 5% y 15% cada cuarto de segundo (Efecto "carga real")
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        setIsVideoLoaded(true);
        clearInterval(interval);
      }
      setLoadProgress(progress);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const startApp = () => {
    setShowWelcome(false);
    setIsPlayingVideo(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoEnd = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
    }
    
    setIsPlayingVideo(false);
    setIsMusicPlaying(true);
    
    if (audioRef.current) {
      audioRef.current.muted = false; 
      audioRef.current.play().catch(err => console.log("Audio play blocked:", err));
    }
  };

  const [globalScores, setGlobalScores] = useState<Record<string, Record<string, number>>>({});

  // 🌍 LECTURA DE CONFIGURACIÓN GLOBAL (Modo Dios)
useEffect(() => {
  const fetchGlobalSettings = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('is_market_open')
      .single();

    if (data) {
      // Si is_market_open es TRUE, isSquadLocked debe ser FALSE (y viceversa)
      setIsSquadLocked(!data.is_market_open);
    }
  };

  fetchGlobalSettings();
}, []);

  useEffect(() => {
    const loadScores = async () => {
      const { data, error } = await supabase.from('player_scores').select('*');
      if (data) {
        const scoresMap: any = {};
        data.forEach(row => {
          // Guardamos la llave EXACTA sin tocar nada
          const rawId = row.player_id; 
          if (!scoresMap[rawId]) scoresMap[rawId] = {};
          scoresMap[rawId][row.matchday] = row.points;
        });
        setGlobalScores(scoresMap);
      }
    };
    loadScores();
  }, []);
  // 🛡️ VIGILANTE DE SEGURIDAD INTERNO
  const canNavigateAway = () => {
    if (view === 'squad' && !isSquadLocked) {
      alert('⚠️ ¡CUIDADO! Debes VALIDAR LA PLANTILLA antes de cambiar de apartado.');
      return false;
    }
    if (view === 'quiniela' && hasUnsavedQuiniela) {
      alert('⚠️ ¡CUIDADO! Debes GUARDAR LA QUINIELA antes de cambiar de apartado.');
      return false;
    }
    return true;
  };

  // 💥 REPARADO: Aquí está la lógica real para pausar y reproducir
  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log("Audio play blocked:", err));
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const nextTrack = () => {
    const next = (currentTrack + 1) % playlist.length;
    setCurrentTrack(next);
    if (isMusicPlaying && audioRef.current) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log("Audio play blocked:", err));
        }
      }, 50);
    }
  };

  useEffect(() => {
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const nextDeadline = JORNADAS_DEADLINES.find(j => j.date > now);

      if (!nextDeadline) {
        setCountdown(prev => ({ ...prev, targetName: 'TORNEO FINALIZADO', expired: true }));
        clearInterval(timer);
        return;
      }

      const distance = nextDeadline.date - now;
      setCountdown({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
        targetName: nextDeadline.label,
        targetId: nextDeadline.id,
        expired: false
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);
    
  const [showSectionHelp, setShowSectionHelp] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  // --- TORRE DE CONTROL DE MARCADORES ---
const [results, setResults] = useState<Record<string, any>>({});

const [lineupsHistory, setLineupsHistory] = useState<Record<string, any>>({});
const [squadData, setSquadData] = useState<any>({}); // Tu base

useEffect(() => {
  const fetchInitialResults = async () => {
    const { data } = await supabase.from('match_results').select('*');
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((r) => (map[r.match_id] = r));
      setResults(map);
    }
  };
  
  if (session) {
    fetchInitialResults();
  }
}, [session]);
  
  const [user, setUser] = useState<any>({
    email: '',
    username: 'Invitado',
    teamName: 'MI EQUIPO',
    id: '',
  });
  
  const isAdmin = user?.email === 'admin@mundial2026.com';
  
  const [view, setView] = useState<'rules' | 'squad' | 'quiniela' | 'calendar' | 'lineups' | 'scores' | 'admin'>('rules');
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (isAdmin) setTutorialStep(0);
  }, [isAdmin]);

  // 🔄 CARGA INICIAL BLINDADA
useEffect(() => {
  const fetchInitialData = async () => {
    if (!session?.user?.id) return; 

    const { data, error } = await supabase
      .from('profiles')
      .select('lineups_history, squad_data')
      .eq('id', session.user.id)
      .single();

    if (data) {
      // 🚨 BLINDAJE: Aquí está el secreto. Clonamos ANTES de guardar en el estado.
      // Así, pase lo que pase en el resto de la app, 'base' y 'history' no se tocan.
      const base = JSON.parse(JSON.stringify(data.squad_data || {}));
      const history = JSON.parse(JSON.stringify(data.lineups_history || {}));
      
      setSquadData(base);         
      setLineupsHistory(history); 
    }
  };

  fetchInitialData();
}, [session?.user?.id]);


  // ⚡ ACTUALIZACIÓN INSTANTÁNEA (Modo Paranoico + Retorno a Plantilla)
  useEffect(() => {
    if (view === 'lineups') {
      // Si estamos en Alineaciones, cargamos la jornada que toque
      let target = { selected: {}, bench: {}, extras: {}, captain: null };

      if (lineupsHistory && lineupsHistory[lineupsMatchday]) {
        target = JSON.parse(JSON.stringify(lineupsHistory[lineupsMatchday]));
      } else if (squadData && Object.keys(squadData).length > 0) {
        target = JSON.parse(JSON.stringify(squadData));
      }

      setSelected(target.selected || {});
      setBench(target.bench || {});
      setExtras(target.extras || {});
      setCaptain(target.captain || null);

    } else if (view === 'squad') {
      // 🔥 LA PIEZA QUE FALTABA 🔥
      // Si volvemos a la pantalla de Plantilla, OBLIGAMOS a cargar la base limpia
      if (squadData && Object.keys(squadData).length > 0) {
        setSelected(JSON.parse(JSON.stringify(squadData.selected || {})));
        setBench(JSON.parse(JSON.stringify(squadData.bench || {})));
        setExtras(JSON.parse(JSON.stringify(squadData.extras || {})));
        setCaptain(squadData.captain || null);
      }
    }
  }, [view, lineupsMatchday, lineupsHistory, squadData]);

  // --- ESTADOS DE LA PLANTILLA (Carga desde Supabase) ---
  const [selected, setSelected] = useState<any>({});
  const [bench, setBench] = useState<any>({});
  const [extras, setExtras] = useState<any>({});
  // Cambia number por string
  const [captain, setCaptain] = useState<string | null>(null);

  const [isSquadLocked, setIsSquadLocked] = useState(true);

  // 🧠 CEREBRO DEL MERCADO: Calcula los cambios y el presupuesto en tiempo real
  useEffect(() => {
    // 🛡️ CONTROL DE USUARIOS NUEVOS: Si no hay foto (porque es un usuario limpio sin datos), 
    // asumimos una estructura vacía en lugar de congelar la ejecución.
    const currentSnapshot = snapshotSquad || { selected: {}, bench: {}, extras: {} };

    // 1. Juntar todos los jugadores ACTUALES en una sola lista
    const currentAllPlayers = [
      ...Object.values(selected || {}),
      ...Object.values(bench || {}),
      ...Object.values(extras || {})
    ].filter(Boolean) as any[];

    // 2. Juntar todos los jugadores de la FOTO ORIGINAL en otra lista
    const snapshotAllPlayers = [
      ...Object.values(currentSnapshot.selected || {}),
      ...Object.values(currentSnapshot.bench || {}),
      ...Object.values(currentSnapshot.extras || {})
    ].filter(Boolean) as any[];

    // 3. CONTAR LOS FICHAJES
    let changesCount = 0;
    currentAllPlayers.forEach((player: any) => {
      // Si un jugador que está ahora NO estaba en la foto, cuenta como 1 cambio
      const wasInSnapshot = snapshotAllPlayers.find((p: any) => p.id === player.id);
      if (!wasInSnapshot) {
        changesCount++;
      }
    });
    setTransfersMade(changesCount);

    // 4. CALCULAR EL PRESUPUESTO
    const INITIAL_BUDGET = 800; 
    
    // Sumamos lo que cuestan todos los jugadores que tiene en plantilla AHORA MISMO
    const totalSquadValue = currentAllPlayers.reduce((sum, player) => sum + (player.precio || 0), 0);
    
    // Fórmula mágica: (Presupuesto Base + Premio Quiniela) - Valor de la plantilla actual.
    const moneyAvailable = INITIAL_BUDGET + quinielaPrize - totalSquadValue;
    
    // Redondeamos a un decimal para evitar que salgan números raros
    setCurrentBudget(Math.round(moneyAvailable * 10) / 10);

  }, [selected, bench, extras, snapshotSquad, quinielaPrize]);

  const [activeMatchday, setActiveMatchday] = useState('PRE'); // PRE = Fase de preparación
  const [scores, setScores] = useState<Record<string, number | null>>({});

    // ==========================================
    // 🧠 AQUÍ VA EL CEREBRO DE SUSTITUCIONES Y PUNTOS REALES
    // ==========================================
    const evaluatedPlayers = useMemo(() => {
      const playerStats: any = {};
      const startersMissing: any[] = [];
      const benchAvailable: any[] = [];
  
      const isValidFormation = (counts: any) => {
         return counts.POR === 1 &&
                counts.DEF >= 3 && counts.DEF <= 5 &&
                counts.MED >= 3 && counts.MED <= 5 &&
                counts.DEL >= 1 && counts.DEL <= 3;
      };
  
      let currentActivePositions = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
  
      Object.entries(selected).forEach(([slotId, p]: any) => {
        if (!p) return;
        const playerKey = `${p.nombre.trim()}_${p.equipo.trim()}`; // 👈 Clave única limpia
        
        // 🚀 CONEXIÓN REAL: Leemos los puntos de la base de datos (scores)
        // Si el jugador no existe en scores, le ponemos '-'
        const pts = scores && scores[playerKey] !== undefined ? scores[playerKey] : '-';
        
        // Consideramos que no ha jugado si no tiene puntos asignados o tiene un '-'
        const didNotPlay = pts === '-'; 
        
        playerStats[playerKey] = { points: pts, isSubbedOut: false, isSubbedIn: false, id: playerKey, slotId };
        
        if (didNotPlay) startersMissing.push(playerKey);
        else currentActivePositions[p.posicion as keyof typeof currentActivePositions]++;
      });
  
      ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].forEach(slotId => {
        const p = bench[slotId];
        if (!p) return;
        const playerKey = `${p.nombre.trim()}_${p.equipo.trim()}`; 
        
        // 🚀 CONEXIÓN REAL BANQUILLO
        const pts = scores && scores[playerKey] !== undefined ? scores[playerKey] : '-';
        const didNotPlay = pts === '-';
        
        playerStats[playerKey] = { points: pts, isSubbedOut: false, isSubbedIn: false, id: playerKey, slotId };
        
        if (!didNotPlay) benchAvailable.push(playerKey);
     });
  
     Object.values(extras).forEach((p: any) => {
      if (!p) return;
      const playerKey = `${p.nombre.trim()}_${p.equipo.trim()}`; 
      
      // 🚀 CONEXIÓN REAL EXTRAS
      const pts = scores && scores[playerKey] !== undefined ? scores[playerKey] : '-';
      playerStats[playerKey] = { points: pts, isSubbedOut: false, isSubbedIn: false, id: playerKey };
    });
  
    for (const subId of benchAvailable) {
      if (startersMissing.length === 0) break; 
      
      const [subNombre, subEquipo] = subId.split('_');
      
      const subPlayer = Object.values(bench).find((p: any) => 
         p && p.nombre.trim() === subNombre && p.equipo.trim() === subEquipo
      ) as any;
  
      if (!subPlayer) continue; 
      
      for (let i = 0; i < startersMissing.length; i++) {
            const missingId = startersMissing[i];
            const testCounts = { ...currentActivePositions };
            testCounts[subPlayer.posicion as keyof typeof testCounts]++; 
  
            if (isValidFormation(testCounts)) {
               playerStats[missingId].isSubbedOut = true;
               playerStats[subId].isSubbedIn = true;
               currentActivePositions = testCounts; 
               startersMissing.splice(i, 1); 
               break; 
            }
         }
      }
  
      return playerStats;
    }, [selected, bench, extras, scores]); // 👈 ¡CRUCIAL! Hemos añadido 'scores' aquí

  // --- 4. OTROS ESTADOS DE LA APP ---
  
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [step, setStep] = useState(2); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('SELECCIÓN');
  const [filterPosition, setFilterPosition] = useState('TODAS');
  const [sortOption, setSortOption] = useState<'price-desc' | 'price-asc' | 'name-asc' | 'name-desc'>('price-desc');
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketWindow, setMarketWindow] = useState<'groups' | 'octavos' | null>('groups');

  const [adminScoreCountry, setAdminScoreCountry] = useState('SELECCIÓN');

  const [adminTab, setAdminTab] = useState<'partidos' | 'tesoreria' | 'puntos' | 'auditoria'>('puntos');
  
  const [unusedTeams, setUnusedTeams] = useState<string[]>([]);

  const auditUnusedTeams = async () => {
    // 1. Traemos los perfiles
    const { data: profiles } = await supabase.from('profiles').select('squad_data');
    if (!profiles) return;

    // 2. Extraemos todos los equipos usados por los usuarios
    const usedTeams = new Set<string>();
    profiles.forEach((p: any) => {
      const squad = p.squad_data || {};
      // Revisamos todas las secciones de la plantilla
      [squad.selected, squad.bench, squad.extras].forEach((section) => {
        if (!section) return;
        Object.values(section).forEach((player: any) => {
          if (player?.equipo) usedTeams.add(player.equipo);
        });
      });
    });

    // 3. Obtenemos todos los equipos posibles (asegúrate de tener ALL_PLAYERS accesible)
    const allTeams = Array.from(new Set(ALL_PLAYERS.map((p) => p.equipo)));
    
    // 4. Filtramos los que nadie ha usado
    const unused = allTeams.filter((team) => !usedTeams.has(team));
    setUnusedTeams(unused);
  };

  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserProfile = async (sessionUser: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('team_name, username, squad_data')
        .eq('id', sessionUser.id)
        .single();
    
      if (data) {
        setUser({
          email: sessionUser.email,
          teamName: data.team_name,
          username: data.username,
          id: sessionUser.id
        });
    
        if (data.squad_data) {
          const { 
            selected: s, 
            bench: b, 
            extras: e, 
            captain: c,
            snapshot: savedSnapshot, 
            snapshotMatchday: savedMatchday 
          } = data.squad_data;
    
          setSelected(s || {});
          setBench(b || {});
          setExtras(e || {});
          setCaptain(c || null);
    
          if (savedSnapshot && savedMatchday === activeMatchday) {
            setSnapshotSquad(savedSnapshot);
          } else {
            const newSnapshot = {
              selected: s || {},
              bench: b || {},
              extras: e || {}
            };
            setSnapshotSquad(newSnapshot);
    
            await supabase
              .from('profiles')
              .update({
                squad_data: {
                  ...data.squad_data,
                  snapshot: newSnapshot,
                  snapshotMatchday: activeMatchday 
                }
              })
              .eq('id', sessionUser.id);
          }
        }
    
        // 🛡️ COJÍN DE SEGURIDAD: Damos 1 segundo de cortesía tras cargar los datos 
        // para que la interfaz se asiente por completo antes de activar el auto-guardado.
        setTimeout(() => {
          isInitialLoadComplete.current = true;
        }, 1000);
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
        // 🧹 LIMPIEZA TOTAL AL SALIR
        setUser({ email: '', username: 'Invitado', teamName: 'MI EQUIPO', id: '' });
        setSelected({});
        setBench({});
        setExtras({});
        setCaptain(null);
        setSnapshotSquad(null);
        if (typeof setSquadData === 'function') setSquadData({});
        if (typeof setLineupsHistory === 'function') setLineupsHistory({});
        
        // Apagamos el interruptor al salir
        isInitialLoadComplete.current = false;
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [activeMatchday]);
  // =========================================================================
  // 🏆 EFECTO NUEVO: Descarga las plantillas y lee el historial por NOMBRE
  // =========================================================================
  useEffect(() => {
    if (!globalScores || Object.keys(globalScores).length === 0) return;
    const fetchLeaderboard = async () => {
      if (view !== 'scores') return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, team_name, username, squad_data, lineups_history, has_paid');

      if (data) {
        const matchdays = ['J1', 'J2', 'J3', '16V', 'OCT', 'CUA', 'SEM', 'FIN'];
        
        const formattedUsers = data.map((u: any) => {
          const history = u.lineups_history || {};
          const s = u.squad_data?.selected || {};
          const b = u.squad_data?.bench || {};
          const e = u.squad_data?.extras || {};
          
          // 🧠 HELPER: Si no hay ID, usamos el nombre del jugador como llave única
          const getUid = (p: any) => p?.id || p?.nombre;

          const activePlayerUids = new Set(
            [...Object.values(s), ...Object.values(b), ...Object.values(e)]
              .filter(Boolean)
              .map(getUid)
          );

          const allPlayersMap = new Map();

          const addPlayer = (player: any) => {
            if (!player) return;
            const uid = getUid(player);
            // Si el jugador no tiene ni ID ni Nombre, lo ignoramos
            if (!uid) return;

            if (!allPlayersMap.has(uid)) {
              allPlayersMap.set(uid, {
                ...player,
                isActive: activePlayerUids.has(uid),
                isCaptain: false,
                puntosCalculados: {}
              });
            }
          };

          [...Object.values(s), ...Object.values(b), ...Object.values(e)].forEach(addPlayer);

          let totalPoints = 0;

          // Dentro de tu fetchLeaderboard, sustituye el bloque matchdays.forEach por este:

          matchdays.forEach(j => {
            // 🚀 EL FALLBACK: Si el historial está en blanco, usamos la alineación actual ('s')
            const snapshot = history[j] || { selected: s, captain: u.squad_data?.captain };
          
            if (snapshot && snapshot.selected) {
              const matchdayCaptainUid = snapshot.captain;
          
              Object.values(snapshot.selected).forEach((player: any) => {
                if (!player) return;
                const uid = getUid(player);
                if (!uid) return;
          
                addPlayer(player);
          
                const fullPlayer = allPlayersMap.get(uid);
                if (!fullPlayer) return;
          
                // ESTA ES LA CLAVE DE BÚSQUEDA DEFINITIVA
                const scoreKey = `${fullPlayer.nombre.trim()}_${fullPlayer.equipo.trim()}`;
          
                // Buscamos los puntos en globalScores
                const rawPoints = Number(globalScores[scoreKey]?.[j] || 0);
          
                const isCap = uid === matchdayCaptainUid;
                const earnedPoints = isCap ? rawPoints * 2 : rawPoints;
                
                totalPoints += earnedPoints;
          
                const pRecord = allPlayersMap.get(uid);
                if (pRecord) {
                  pRecord.puntosCalculados[j] = earnedPoints;
                  if (isCap) pRecord.isCaptain = true;
                }
              });
            }
          });
console.log(`DEBUG: Usuario ${u.team_name} calculado. Puntos totales: ${totalPoints}`);
          const finalPlayers = Array.from(allPlayersMap.values()).map(p => ({
            ...p,
            puntos: p.puntosCalculados 
          }));

          return {
            id: u.id,
            name: u.team_name || 'SIN NOMBRE',
            username: u.username || 'ANÓNIMO',
            total: totalPoints,
            isMe: u.id === session?.user?.id,
            hasPaid: u.has_paid ?? false,
            players: finalPlayers.sort((a: any, b: any) => {
              if (a.isActive && !b.isActive) return -1;
              if (!a.isActive && b.isActive) return 1;
              const positionOrder: any = { POR: 1, DEF: 2, MED: 3, DEL: 4 };
              return (positionOrder[a.posicion] || 5) - (positionOrder[b.posicion] || 5);
            })
          };
        });

        console.log("¿Hay totales calculados?", formattedUsers.map(u => ({ name: u.name, total: u.total })));
        setLeaderboard(formattedUsers);
        
      }
    };

    fetchLeaderboard();
  }, [view, session, selected, bench, extras, captain, snapshotSquad, globalScores]);

  const fetchAllProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, team_name, has_paid')
      .order('team_name', { ascending: true });
    if (data) setAllProfiles(data);
  };

  useEffect(() => {
    if ((view === 'admin' && adminTab === 'tesoreria') || view === 'scores') {
      fetchAllProfiles();
    }
  }, [view, adminTab]);

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
  // ==========================================================================
  // FUNCIÓN REFORZADA: GUARDADO EXCLUSIVO PARA HISTORIAL
  // ==========================================================================
  const saveSquadToSupabase = async (historyToSave?: any) => { 
    if (!session?.user?.id) return;
  
    try {
      // 1. Validamos que tengamos algo que guardar
      if (!historyToSave) {
        console.log("No hay historial para guardar, omitiendo...");
        return;
      }
  
      // 2. Preparamos el payload EXCLUSIVAMENTE para el historial.
      // Ya NO tocamos 'squad_data' aquí para evitar conflictos con el useEffect.
      const updatePayload = {
        lineups_history: historyToSave
      };
  
      // 3. Subimos a Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', session.user.id);
  
      if (updateError) {
        console.error('Error al guardar historial en nube:', updateError.message);
      } else {
        console.log(`¡Historial guardado en Supabase correctamente!`);
      }
    } catch (err) {
      console.error('Error inesperado en saveSquadToSupabase:', err);
    }
  };

// Añade esta función en tu código (donde tienes las otras funciones de Supabase)
const saveLineupHistoryToSupabase = async (newHistory: any) => {
  if (!session?.user?.id) return;
  
  // 🛡️ AQUÍ ESTÁ EL BLOQUEO: 
  // Solo pasamos el campo 'lineups_history'.
  // Aunque 'newHistory' contuviera 'squad_data' por error, 
  // esto solo actualizará la columna lineups_history.
  const { error } = await supabase
    .from('profiles')
    .update({ 
       lineups_history: newHistory 
    })
    .eq('id', session.user.id);

  if (error) console.error('Error:', error);
};

  // --- 5. LÓGICA DE CONTROL DEL TUTORIAL ---
  useEffect(() => {
    const hasSeen = localStorage.getItem('mundial_caddy_v5');
    if (!hasSeen) {
      setIsTutorialActive(true);
      setTutorialStep(0);
      setView('rules');
    } else {
      // YA NO BLOQUEAMOS AQUÍ. 
      // El bloqueo real lo manejará el nuevo useEffect que consulta 'app_settings'.
      console.log("Tutorial visto, esperando sincronización de mercado con Supabase...");
    }
  }, []);

  const nextStep = (targetView?: any) => {
    if (targetView) setView(targetView);
    if (targetView === 'quiniela') {
      setIsSquadLocked(true);
      saveSquadToSupabase(lineupsHistory); // <--- Aquí le pasamos el historial actual
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
  localStorage.setItem('mf26_selected', JSON.stringify(selected));
  localStorage.setItem('mf26_bench', JSON.stringify(bench));
  localStorage.setItem('mf26_extras', JSON.stringify(extras));
  localStorage.setItem('mf26_captain', JSON.stringify(captain));
  localStorage.setItem('mf26_isLocked', JSON.stringify(isSquadLocked));
  }, [selected, bench, extras, captain, isSquadLocked]);

  // --- PROTECCIÓN CONTRA SALIDAS ACCIDENTALES EN MÓVILES Y PC ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. BLINDAJE PARA PC Y RECARGAS
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((view === 'squad' && !isSquadLocked) || (view === 'quiniela' && hasUnsavedQuiniela)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. BLINDAJE PARA MÓVILES
    window.history.pushState(null, '', window.location.pathname);
    
    const handlePopState = () => {
      if (view === 'squad' && !isSquadLocked) {
        alert('⚠️ ACCIÓN BLOQUEADA: Debes validar la plantilla antes de salir de la app.');
        window.history.pushState(null, '', window.location.pathname);
        return;
      }
      if (view === 'quiniela' && hasUnsavedQuiniela) {
        alert('⚠️ ACCIÓN BLOQUEADA: Debes guardar la quiniela antes de salir de la app.');
        window.history.pushState(null, '', window.location.pathname);
        return;
      }

      const confirmExit = window.confirm('¿Quieres salir de la aplicación Mundial Fantástico 2026?');
      if (confirmExit) {
        window.removeEventListener('popstate', handlePopState);
        setTimeout(() => window.history.back(), 50);
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [view, isSquadLocked, hasUnsavedQuiniela]); // 👈 Añadido al array

  useEffect(() => {
    // Si entra el administrador, fulminamos el tutorial para que no estorbe
    if (isAdmin) {
      setTutorialStep(0); 
    }
  }, [isAdmin]);

  // --- AUTO-GUARDADO DE PLANTILLA BLINDADO POR JORNADA ---
  useEffect(() => {
    const saveSquadData = async () => {
      // 1. Escudo de carga: no hagas nada si no han llegado los datos
      if (!isInitialLoadComplete.current) return;
  
      // 2. Escudo de jornada: no toques nada si es histórico
      if (activeMatchday !== 'PRE') return;
  
      // 3. 🛡️ PROTECCIÓN ANTIBORRADO (La más importante)
      // Contamos cuántos jugadores hay. Un equipo real mínimo tiene al menos 11 titulares.
      const totalPlayers = Object.keys(selected).length;
      if (totalPlayers < 11) {
        console.warn("⚠️ GUARDADO BLOQUEADO: El equipo tiene menos de 11 jugadores. Protegiendo datos.");
        return; 
      }
  
      // 4. Seguridad de ID
      if (!user?.id || user.id === '000-111') return;
  
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          squad_data: { selected, bench, extras, captain },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' }); 
  
      if (error) console.error("Error al guardar plantilla:", error);
    };
  
    saveSquadData();
  }, [selected, bench, extras, captain, user?.id, activeMatchday]);

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
    if (budgetSpent > 800)
      return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]';
    if (budgetSpent >= 750)
      return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]';
    if (budgetSpent >= 700)
      return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]';
    return 'bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.8)]';
  };

  // Para mantener compatibilidad con otras partes de tu código (como el texto)
  const isBudgetLow = budgetSpent >= 750;

  // Calculamos las selecciones y añadimos el contador dinámico (X/7)
const availableCountriesWithCount = useMemo(() => {
  // 1. Obtenemos los países desde ALL_PLAYERS usando .equipo
  const countries = new Set(ALL_PLAYERS.map((p) => p.equipo));
  const sortedCountries = Array.from(countries).sort();

  return [
    'SELECCIÓN',
    ...sortedCountries.map((c) => {
      // 2. Filtramos allSquadPlayers usando .equipo (¡Ojo! Asegúrate de que 
      // tus jugadores fichados también usen la propiedad .equipo)
      const count = allSquadPlayers.filter((p) => p.equipo === c).length;
      return `${c} (${count}/7)`;
    }),
  ];
}, [allSquadPlayers]);

  const filteredAndSortedPlayers = useMemo(() => {
    return ALL_PLAYERS.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.equipo.toLowerCase().includes(searchTerm.toLowerCase());

      // Limpiamos el nombre de la selección quitando el " (X/7)" para filtrar correctamente
      const cleanFilterCountry =
        filterCountry === 'SELECCIÓN'
          ? 'SELECCIÓN'
          : filterCountry.split(' (')[0];
      const matchesCountry =
        cleanFilterCountry === 'SELECCIÓN' ||
        p.equipo === cleanFilterCountry;

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
    // 🛡️ CONTROL CORONAVIRUS: ¿El mercado está abierto?
    if (!isMarketOpen) {
      return alert('❌ MERCADO CERRADO:\nNo se permiten realizar fichajes en este momento.');
    }

    if (!activeSlot) return alert('⚠️ Selecciona primero un hueco vacío.');

    // --- HUELLA DIGITAL (Para evitar duplicados) ---
    const playerUniqueId = `${player.nombre.trim().toLowerCase()}_${player.equipo.trim().toLowerCase()}`;

    // Identificar si estamos reemplazando a alguien y cuánto vale
    const currentPlayerInSlot =
      activeSlot.type === 'titular' ? selected[activeSlot.id] : 
      activeSlot.type === 'bench' ? bench[activeSlot.id] : 
      extras[activeSlot.id];
      
    const currentSlotValue = currentPlayerInSlot ? currentPlayerInSlot.precio : 0;

    // 1. BLOQUEO DE 12º JUGADOR
    if (activeSlot.type === 'titular') {
      const currentTitulars = Object.values(selected).filter(Boolean).length;
      if (currentTitulars >= 11 && !currentPlayerInSlot) {
        return alert('❌ Ya tienes 11 titulares. Primero debes vender a uno.');
      }
    }

    // 2. Comprobar si ya está fichado (en OTRO hueco) - USANDO HUELLA DIGITAL
    const isAlreadyInTeam = allSquadPlayers.some(p => `${p.nombre}_${p.equipo}` === `${player.nombre}_${player.equipo}`);
    const isReplacingSamePlayer = currentPlayerInSlot && 
                                 currentPlayerInSlot.nombre === player.nombre && 
                                 currentPlayerInSlot.equipo === player.equipo;

    if (isAlreadyInTeam && !isReplacingSamePlayer) {
      return alert('⚠️ Este jugador ya está en tu equipo.');
    }

    // 3. VALIDACIÓN: Límite de jugadores misma selección
    const isGroupStage = ['J1', 'J2', 'J3'].includes(activeMatchday);
    const maxPlayersPerCountry = isGroupStage ? 7 : 8;

    const otherPlayers = allSquadPlayers.filter((p) => p.nombre !== currentPlayerInSlot?.nombre);
    const playersFromSameCountry = otherPlayers.filter((p) => p.equipo === player.equipo).length;

    if (playersFromSameCountry >= maxPlayersPerCountry) {
      return alert(`❌ LÍMITE ALCANZADO: Max ${maxPlayersPerCountry} jugadores de ${player.equipo}.`);
    }

    // 🔄 CONTROL INTELIGENTE DE LOS 6 CAMBIOS
const isInitialSetup = Date.now() < JORNADAS_DEADLINES[0].date;

// AÑADIMOS LA CONDICIÓN: Si el mercado está abierto (isSquadLocked es false), 
// saltamos la lógica de bloqueo de cambios.
if (!isInitialSetup && isSquadLocked) {
    const isIncomingPlayerNew = !snapshotSquad || ![
      ...Object.values(snapshotSquad.selected || {}),
      ...Object.values(snapshotSquad.bench || {}),
      ...Object.values(snapshotSquad.extras || {})
    ].some((p: any) => p && p.nombre === player.nombre && p.equipo === player.equipo);

    const isCurrentPlayerNew = !snapshotSquad || (currentPlayerInSlot && ![
      ...Object.values(snapshotSquad.selected || {}),
      ...Object.values(snapshotSquad.bench || {}),
      ...Object.values(snapshotSquad.extras || {})
    ].some((p: any) => p && p.nombre === currentPlayerInSlot.nombre && p.equipo === currentPlayerInSlot.equipo));

    // Si el jugador que entra es nuevo, ya llevas 6 cambios, Y NO estás sustituyendo a otro jugador nuevo... ¡BLOQUEO!
    if (isIncomingPlayerNew && transfersMade >= 6 && !isCurrentPlayerNew) {
      return alert(
        `❌ LÍMITE DE CAMBIOS:\nHas agotado tus 6 cambios permitidos para esta ventana de mercado.`
      );
    }
}

    // 4. VALIDACIÓN: Presupuesto
    const futureBudget = currentBudget + currentSlotValue - player.precio;
    if (futureBudget < 0) {
      return alert(`⚠️ PRESUPUESTO INSUFICIENTE.`);
    }

    // 5. VALIDACIÓN: Posición
    if (activeSlot.type === 'titular' && activeSlot.pos !== player.posicion) {
      return alert(`⚠️ Posición incorrecta.`);
    }

    // ASIGNACIÓN DEL JUGADOR
    const newPlayer = { ...player };
    if (activeSlot.type === 'titular') setSelected({ ...selected, [activeSlot.id]: newPlayer });
    else if (activeSlot.type === 'bench') setBench({ ...bench, [activeSlot.id]: newPlayer });
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
    { id: 'lineups', label: 'ALINEACIONES', icon: '👕' },
    { id: 'scores', label: 'CLASIFICACIÓN', icon: '⭐' },
    { id: 'calendar', label: 'CALENDARIO', icon: '📅' },
    { id: 'admin', label: 'MODO DIOS', icon: '⚙️' },
  ];

  const visibleNavItems = navItems.filter((item) => {
    // Aquí bloqueamos el Modo Dios para todos excepto para el jefe
    if (item.id === 'admin') return user?.email === 'admin@mundial2026.com';
    return true;
  });

  // 👇 FUNCIÓN DE SUSTITUCIONES (Nueva) 👇
  const renderSubstitutionOptions = () => {
    if (!activeSlot) return null;

    const originPlayer = activeSlot.type === 'titular' ? selected[activeSlot.id] :
                         activeSlot.type === 'bench' ? bench[activeSlot.id] : extras[activeSlot.id];

    if (!originPlayer) {
       return <div className="text-center text-white/40 mt-10 text-xs font-bold uppercase bg-white/5 p-6 rounded-2xl">Este hueco está vacío. Ve a PLANTILLA para fichar.</div>;
    }

    let options: any[] = [];
    if (activeSlot.type !== 'titular') {
      Object.entries(selected).forEach(([id, p]: any) => {
        if (p && p.posicion === originPlayer.posicion) options.push({ slotId: id, type: 'titular', player: p });
      });
    }
    if (activeSlot.type !== 'bench') {
      Object.entries(bench).forEach(([id, p]: any) => {
        if (p && p.posicion === originPlayer.posicion) options.push({ slotId: id, type: 'bench', player: p });
      });
    }
    if (activeSlot.type !== 'extras') {
      Object.entries(extras).forEach(([id, p]: any) => {
        if (p && p.posicion === originPlayer.posicion) options.push({ slotId: id, type: 'extras', player: p });
      });
    }

    if (options.length === 0) {
       return <div className="text-center text-white/40 mt-10 text-xs font-bold uppercase bg-white/5 p-6 rounded-2xl">No tienes más jugadores de posición {originPlayer.posicion} para realizar el cambio.</div>;
    }

    return options.map((opt) => (
      <div key={opt.player.id} className="flex items-center justify-between bg-black/40 border border-white/10 p-3 rounded-xl hover:border-blue-500 transition-colors mb-2">
        <div className="flex flex-col">
          <span className="font-black text-sm uppercase">{opt.player.nombre}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-500 text-white`}>{opt.player.posicion}</span>
            <span className="text-[10px] text-white/50">{opt.player.equipo} | En: {opt.type === 'titular' ? 'Campo 11' : opt.type === 'bench' ? 'Banquillo' : 'Grada'}</span>
          </div>
        </div>
        <button
          onClick={() => {
            // 1. CLONADO PROFUNDO INMEDIATO:
            // Convertimos a string y volvemos a objeto para crear una instancia 100% nueva
            const playerA = JSON.parse(JSON.stringify(originPlayer));
            const playerB = JSON.parse(JSON.stringify(opt.player));
          
            // 2. CREAMOS COPIAS PROFUNDAS DE LOS ESTADOS TAMBIÉN:
            const newSelected = JSON.parse(JSON.stringify(selected));
            const newBench = JSON.parse(JSON.stringify(bench));
            const newExtras = JSON.parse(JSON.stringify(extras));
          
            // 3. REALIZAMOS EL INTERCAMBIO CON LOS CLONES:
            if (opt.type === 'titular') newSelected[opt.slotId] = playerA;
            else if (opt.type === 'bench') newBench[opt.slotId] = playerA;
            else newExtras[opt.slotId] = playerA;
          
            if (activeSlot.type === 'titular') newSelected[activeSlot.id] = playerB;
            else if (activeSlot.type === 'bench') newBench[activeSlot.id] = playerB;
            else newExtras[activeSlot.id] = playerB;
          
            // 4. ACTUALIZAMOS EL ESTADO CON LOS OBJETOS NUEVOS:
            setSelected(newSelected);
            setBench(newBench);
            setExtras(newExtras);
          
            // Lógica del capitán (esto es seguro porque comparamos IDs, no objetos)
            if (captain === originPlayer.id && activeSlot.type === 'titular' && opt.type !== 'titular') setCaptain(null);
            if (captain === opt.player.id && opt.type === 'titular' && activeSlot.type !== 'titular') setCaptain(null);
          
            setActiveSlot(null);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        >
          🔄 Cambiar
        </button>
      </div>
    ));
  };
  // 👆 FIN DE LA FUNCIÓN DE SUSTITUCIONES 👆

  // --- EL PORTERO (Guardia de sesión) ---
  if (!session) {
    return <AuthScreen onLoginSuccess={(userData: any) => setSession(userData)} />;
  }

  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans selection:bg-[#22c55e] selection:text-black pb-24">
      
      {/* ==========================================
          1. PANTALLA DE BIENVENIDA ("PRESS START")
          ========================================== */}
      {showWelcome && (
        <div className="fixed inset-0 z-[200] bg-[#0a101f] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          
          <div className="w-64 h-64 sm:w-80 sm:h-80 mb-10 flex items-center justify-center transition-all">
            <img
              src="/img/logo_mf2026.png" 
              alt="Mundial Fantástico 2026"
              className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(34,197,94,0.4)] animate-pulse-slow"
            />
          </div>

          {/* LÓGICA DE PRECARGA: Barra vs Botón */}
          {!isVideoLoaded ? (
            <div className="flex flex-col items-center gap-3 w-64 animate-in fade-in duration-300">
              {/* Barra base */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                {/* Barra de progreso verde brillante */}
                <div 
                  className="h-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-all duration-200 ease-out" 
                  style={{ width: `${loadProgress}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#22c55e] animate-pulse">
                Cargando recursos... {loadProgress}%
              </span>
            </div>
          ) : (
            <button 
              onClick={startApp}
              className="bg-[#22c55e] text-black text-xl font-black uppercase px-10 py-5 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-105 transition-transform active:scale-95 animate-in zoom-in duration-300"
            >
              ¡VAMOS A JUGAR!
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          2. VÍDEO DE INTRODUCCIÓN 
          ========================================== */}
      {(showWelcome || isPlayingVideo) && (
        <div className={`fixed inset-0 bg-black flex items-center justify-center transition-opacity duration-1000 ${
            isPlayingVideo ? 'opacity-100 z-[150]' : 'opacity-0 z-[-50] pointer-events-none'
          }`}
        >
          <video 
            ref={videoRef}
            src="/video/intro.mp4" 
            onEnded={handleVideoEnd}
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          />
          
          {/* BOTÓN: OMITIR INTRO */}
          {isPlayingVideo && (
            <button 
              onClick={handleVideoEnd} 
              className="absolute top-8 right-8 bg-[#22c55e] text-black text-xs font-black uppercase px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:scale-105 transition-transform z-[160]"
            >
              Omitir Intro ⏭️
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          3. REPRODUCTOR DE MÚSICA Y CONTROLES
          ========================================== */}
      <audio 
        ref={audioRef} 
        src={playlist[currentTrack]} 
        onEnded={nextTrack} 
        loop={false}
      />

      {/* BOTÓN FLOTANTE DE MÚSICA (Visible en toda la app) */}
      {!showWelcome && !isPlayingVideo && (
        <div className="fixed bottom-6 left-4 z-[100] flex flex-col items-center gap-1.5 animate-in slide-in-from-bottom-5 duration-700">
          
          {/* ETIQUETA LLAMATIVA */}
          <span className="text-[9px] font-black uppercase tracking-widest text-black bg-[#22c55e] px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]">
            Música
          </span>

          {/* CONTROLES */}
          <div className="flex items-center gap-2 bg-[#0a101f]/90 backdrop-blur-md border-2 border-[#22c55e]/40 p-1.5 rounded-full shadow-xl">
            <button 
              onClick={toggleMusic} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all text-lg border-2 ${
                isMusicPlaying 
                  ? 'bg-[#22c55e]/20 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-105' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {isMusicPlaying ? '🔊' : '🔇'}
            </button>
            <button 
              onClick={nextTrack} 
              className="w-8 h-8 rounded-full bg-white/5 border border-transparent flex items-center justify-center hover:bg-[#22c55e]/20 hover:border-[#22c55e]/50 transition-all text-xs" 
              title="Siguiente canción"
            >
              ⏭️
            </button>
          </div>
        </div>
      )}
      
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

        <nav className="max-w-4xl mx-auto mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch] snap-x touch-pan-x px-1">
          {/* USAMOS visibleNavItems PARA OCULTAR EL MODO DIOS AL RESTO */}
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (canNavigateAway()) {
                  setView(item.id as any);
                }
              }}
              // 👇 Añadimos "snap-start" y mantenemos "shrink-0" (implícito por el whitespace-nowrap)
              className={`snap-start flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${
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
  onClick={async () => {
    const newName = prompt(
      'Introduce el nuevo nombre para tu equipo:',
      user.teamName
    );
    
    if (newName && newName.trim() !== '') {
      const upperName = newName.trim().toUpperCase();
      
      // 1. Actualizamos la memoria de la pantalla y el navegador local
      const updatedUser = {
        ...user,
        teamName: upperName,
      };
      setUser(updatedUser);
      localStorage.setItem('mf26_teamName', upperName);

      // 2. 🚀 ENVIAMOS EL CAMBIO A SUPABASE PARA QUE SEA PERMANENTE
      // Nota: Asumo que tu tabla de usuarios se llama 'profiles'. Si se llama distinto, cámbialo aquí.
      const { error } = await supabase
        .from('profiles') 
        .update({ team_name: upperName }) 
        .eq('id', user.id);

      if (error) {
        console.error('Error guardando el nuevo nombre en Supabase:', error);
        alert('Hubo un problema al guardar el nombre en la base de datos.');
      }
    }
  }}
  className="text-white/30 hover:text-[#22c55e] transition-colors text-lg active:scale-95"
  title="Editar nombre del equipo"
>
  ✏️
</button>
                  </div>
                  
{/* Contenedor horizontal para los botones de acción */}
<div className="flex flex-wrap items-center gap-2">
                    
                    {/* 👇 BOTÓN DINÁMICO (MERCADO ABIERTO/CERRADO) 👇 */}
{isSquadLocked ? (
  <button
    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg border-2 flex items-center justify-center gap-2 bg-gray-600 text-white/50 border-white/10 cursor-not-allowed"
    onClick={() => alert("⛔ ¡El Mundial Fantástico 2026 ya ha comenzado! El mercado de fichajes de plantillas iniciales está cerrado.")}
  >
    🔒 Mercado Cerrado
  </button>
) : (
  <button
    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg border-2 flex items-center justify-center gap-2 bg-green-600 text-white border-green-500 cursor-default"
  >
    🟢 Mercado Abierto
  </button>
)}
                  </div>

                  <div
                    className={`mt-2 text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 ${formationInfo.statusColor}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {formationInfo.message}{' '}
                    {formationInfo.count > 0 && `(${formationInfo.count}/11)`}
                  </div>

                  {/* 👇 BOTÓN DE VALIDACIÓN DE PLANTILLA 👇 */}
{!isSquadLocked && formationInfo.isValidTactic && (
  <div className="mt-4 flex justify-center">
    <button
      onClick={() => {
        saveLineupHistoryToSupabase(snapshotSquad);
        alert("¡Alineación validada correctamente! La foto ha sido guardada en la base de datos.");
      }}
      className="px-8 py-3 bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] border-2 border-green-400 flex items-center justify-center gap-2 transform active:scale-95"
    >
      ✅ VALIDAR ALINEACIÓN
    </button>
  </div>
)}
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
                  (!isTutorialActive || tutorialStep >= 1) && 
                  !isSquadLocked
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
                      onClick={() => {                                           
                        if (!isSquadLocked) {
                          setActiveSlot({
                            id,
                            type: 'bench',
                            pos: bench[id]?.posicion,
                          });
                        }
                      }}
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
                      onClick={() => {
                        if (!isSquadLocked) {
                          setActiveSlot({
                            id,
                            type: 'extras',
                            pos: extras[id]?.posicion,
                          });
                        }
                      }}
                    />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. EL NUEVO MERCADO FLOTANTE */}
            {activeSlot && (
              // Fondo del modal: Quitamos el touch-none que nos estaba fastidiando
              <div className="fixed inset-0 z-[100] bg-[#05080f]/95 backdrop-blur-md p-4 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                
                {/* Contenedor Principal: Le damos overflow-hidden para que el scroll se limite SÓLO a la lista */}
                <div className="max-w-md w-full mx-auto flex flex-col h-[80vh] h-[80dvh] overflow-hidden relative">
                  
                  {/* CABECERA (Fija arriba) */}
                  <div className="shrink-0 flex justify-between items-center mb-4 bg-[#1a0b0b] p-4 rounded-2xl border-2 border-[#22c55e] shadow-[0_0_30px_rgba(34,197,94,0.15)]">
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

                  {/* BUSCADOR Y FILTROS (Fijos arriba) */}
                  <div className="shrink-0 space-y-3 mb-4 bg-white/5 p-4 rounded-2xl border border-white/10">
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

                  {/* ZONA DE SCROLL (Aislada del resto del mundo) */}
                  <div className="flex-1 overflow-y-auto relative pb-20 space-y-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
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
                            className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 border 
                              ${isAlreadyOwned && !isCurrentPlayer 
                                ? 'bg-black/20 border-white/5 grayscale opacity-50 cursor-not-allowed' 
                                : 'bg-black/40 border-white/10 hover:border-[#22c55e]'}
                            `}
                          >
                            <div className="flex flex-col">
                              <span className={`font-black text-sm uppercase ${isAlreadyOwned && !isCurrentPlayer ? 'text-white/40' : 'text-white'}`}>
                                {p.nombre}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                    isAlreadyOwned && !isCurrentPlayer
                                      ? 'bg-white/10 text-white/30'
                                      : posColors[p.posicion] || 'bg-gray-500 text-white'
                                  }`}
                                >
                                  {p.posicion}
                                </span>
                                <span className={`text-[10px] ${isAlreadyOwned && !isCurrentPlayer ? 'text-white/20' : 'text-white/50'}`}>
                                  {p.equipo}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`font-black text-sm ${isAlreadyOwned && !isCurrentPlayer ? 'text-white/30' : 'text-white'}`}>
                                {p.precio}M
                              </span>
                              <button
                                onClick={() => {
                                  const playerToBuy = { ...p, posicion: getPosCode(p.posicion) };
                                  handleBuyPlayer(playerToBuy);
                                }}
                                disabled={!!isAlreadyOwned && !isCurrentPlayer}
                                className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${
                                  isAlreadyOwned && !isCurrentPlayer
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
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
        {view === 'quiniela' && (
  <QuinielaView 
    user={user} 
    setHasUnsavedQuiniela={setHasUnsavedQuiniela} // 👈 EL CABLE NUEVO
  />
  )}
        {view === 'calendar' && <CalendarView results={results} />}
        {view === 'lineups' && (
  (() => {
    // 🧠 SANEAMIENTO Y SUSTITUCIONES DE ALINEACIONES
    const currentLineupsPoints = (() => {
      const map: any = {};
      const startersMissing: string[] = [];
      const benchAvailable: string[] = [];
      let currentActivePositions = { POR: 0, DEF: 0, MED: 0, DEL: 0 };

      // 1. Evaluamos a los Titulares
      Object.entries(selected || {}).forEach(([slotId, p]: any) => {
        if (!p) return;
        const scoreKey = `${p.nombre.trim()}_${p.equipo.trim()}`;
        let pts: any = globalScores[scoreKey]?.[lineupsMatchday];
        
        if (pts === undefined) pts = '-';

        // 🛡️ CORRECCIÓN: ID Robusto para asegurar que el Capitán puntúa doble
        const pid = p.id || scoreKey; 
        if (pid === captain && pts !== '-') {
           pts = pts * 2;
        }

        const didNotPlay = pts === '-'; 
        map[scoreKey] = { points: pts, isSubbedOut: false, isSubbedIn: false, id: scoreKey };
        
        if (didNotPlay) {
          startersMissing.push(scoreKey);
        } else {
          currentActivePositions[p.posicion as keyof typeof currentActivePositions]++;
        }
      });

      // 2. Evaluamos al Banquillo
      ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].forEach(slotId => {
        const p = (bench || {})[slotId];
        if (!p) return;
        const scoreKey = `${p.nombre.trim()}_${p.equipo.trim()}`;
        let pts: any = globalScores[scoreKey]?.[lineupsMatchday];
        if (pts === undefined) pts = '-';
        
        map[scoreKey] = { points: pts, isSubbedOut: false, isSubbedIn: false, id: scoreKey };
        if (pts !== '-') benchAvailable.push(scoreKey);
      });

      // 3. Evaluamos Extras
      Object.values(extras || {}).forEach((p: any) => {
        if (!p) return;
        const scoreKey = `${p.nombre.trim()}_${p.equipo.trim()}`;
        let pts: any = globalScores[scoreKey]?.[lineupsMatchday];
        if (pts === undefined) pts = '-';
        map[scoreKey] = { points: pts, isSubbedOut: false, isSubbedIn: false, id: scoreKey };
      });

      // 4. Lógica de sustituciones
      const isValidFormation = (counts: any) => {
         return counts.POR === 1 &&
                counts.DEF >= 3 && counts.DEF <= 5 &&
                counts.MED >= 3 && counts.MED <= 5 &&
                counts.DEL >= 1 && counts.DEL <= 3;
      };

      for (const subKey of benchAvailable) {
        if (startersMissing.length === 0) break;
        const [subName, subTeam] = subKey.split('_');
        const subPlayer = Object.values(bench || {}).find((p: any) => 
           p && p.nombre.trim() === subName && p.equipo.trim() === subTeam
        ) as any;

        if (!subPlayer) continue;

        for (let i = 0; i < startersMissing.length; i++) {
          const missingId = startersMissing[i];
          const testCounts = { ...currentActivePositions };
          testCounts[subPlayer.posicion as keyof typeof testCounts]++; 

          if (isValidFormation(testCounts)) {
             map[missingId].isSubbedOut = true;
             map[subKey].isSubbedIn = true;
             currentActivePositions = testCounts; 
             startersMissing.splice(i, 1); 
             break; 
          }
        }
      }
      return map;
    })();

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto space-y-6">
        
        {/* 1. SELECTOR DE JORNADA */}
        <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-start sm:justify-center">
          {['J1', 'J2', 'J3', 'D16', 'OCT', 'CUA', 'SEM', 'FIN'].map((j) => {
            const isEditable = countdown.targetId === j;
            return (
              <button
                key={j}
                onClick={() => {
                  // 🛡️ BLOQUEO: No dejar cambiar de jornada si estamos editando
                  if (isEditingLineup) {
                    alert("Debes guardar tu alineación para continuar");
                    return;
                  }

                  setLineupsMatchday(j);
                  const snapshot = lineupsHistory[j];
                
                  if (snapshot) {
                     setSelected(JSON.parse(JSON.stringify(snapshot.selected || {})));
                     setBench(JSON.parse(JSON.stringify(snapshot.bench || {})));
                     setExtras(JSON.parse(JSON.stringify(snapshot.extras || {})));
                     setCaptain(snapshot.captain || null);
                  } else {
                     setSelected(JSON.parse(JSON.stringify(squadData.selected || {})));
                     setBench(JSON.parse(JSON.stringify(squadData.bench || {})));
                     setExtras(JSON.parse(JSON.stringify(squadData.extras || {})));
                     setCaptain(squadData.captain || null);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 flex items-center gap-1.5 whitespace-nowrap ${
                  lineupsMatchday === j 
                  ? 'bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
                }`}
              >
                {j} {isEditable && <span className="text-xs animate-bounce">🔓</span>}
              </button>
            );
          })}
        </nav>

        {/* 2. EL TERRENO DE JUEGO */}
        <div className="bg-[#1a2b1a] border-4 border-[#22c55e]/30 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]"></div>
          
          <div className="relative z-10 flex justify-between items-center mb-6 bg-black/40 p-3 sm:p-4 rounded-2xl border border-white/10">
             <div>
               <h3 className="text-white font-black italic uppercase text-lg">Alineación {lineupsMatchday}</h3>
               <p className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 mt-1 ${
                 countdown.targetId === lineupsMatchday ? 'text-[#22c55e]' : 'text-red-500'
               }`}>
                 <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                 {countdown.targetId === lineupsMatchday ? 'Edición Abierta' : 'Bloqueado (Solo lectura)'}
               </p>
             </div>
             
             {/* 🛡️ LÓGICA DE BOTONES EDITAR / GUARDAR */}
             {countdown.targetId === lineupsMatchday ? (
                !isEditingLineup ? (
                  <button 
                    className="bg-[#eab308] text-black px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase shadow-[0_0_15px_rgba(234,179,8,0.4)] hover:scale-105 transition-transform"
                    onClick={() => setIsEditingLineup(true)}
                  >
                    Editar Alineación
                  </button>
                ) : (
                  <button 
                    className="bg-[#22c55e] text-black px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-105 transition-transform"
                    onClick={() => {
                      // Hacemos una copia profunda antes de guardar para desvincular referencias
                      const newSnapshot = { 
                        selected: JSON.parse(JSON.stringify(selected)), 
                        bench: JSON.parse(JSON.stringify(bench)), 
                        extras: JSON.parse(JSON.stringify(extras)), 
                        captain 
                      };
                    
                      const newHistory = { 
                        ...lineupsHistory, 
                        [lineupsMatchday]: newSnapshot 
                      };
                    
                      setLineupsHistory(newHistory);
                    
                      // Función dedicada SOLO a lineups_history
                      if (typeof saveLineupHistoryToSupabase === 'function') {
                        saveLineupHistoryToSupabase(newHistory); 
                      }
                      
                      // Salimos del modo edición
                      setIsEditingLineup(false);
                    
                      if (typeof confetti === 'function') {
                        confetti({
                          particleCount: 100,
                          spread: 70,
                          origin: { y: 0.6 },
                          colors: ['#22c55e', '#ffffff']
                        });
                      }
                      alert(`¡Alineación para la jornada ${lineupsMatchday} guardada en el historial!`);
                    }}
                  >
                    Guardar Alineación
                  </button>
                )
             ) : (
                <div className="bg-white/5 border border-white/10 text-white/40 px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase flex items-center gap-2 cursor-not-allowed">
                  <span>🔒 Cerrado</span>
                </div>
             )}
          </div>

          <div className="relative z-10">
            <Field
              selected={selected}
              step={2}
              evaluatedPlayers={currentLineupsPoints}
              canInteractField={countdown.targetId === lineupsMatchday}
              activeSlot={activeSlot}
              setActiveSlot={(slot: any) => {
                // 🛡️ BLOQUEO EN EL CAMPO
                if (countdown.targetId === lineupsMatchday) {
                  if (!isEditingLineup) {
                    alert("Pulsa el botón EDITAR ALINEACIÓN para hacer cambios.");
                    return;
                  }
                  setActiveSlot(slot);
                }
              }}
              captain={captain}
              setCaptain={(id: any) => {
                // 🛡️ BLOQUEO DE CAPITÁN
                if (countdown.targetId === lineupsMatchday) {
                  if (!isEditingLineup) {
                    alert("Pulsa el botón EDITAR ALINEACIÓN para hacer cambios.");
                    return;
                  }
                  setCaptain(id);
                }
              }}
            />
          </div>

          <div className="relative z-10 mt-2 mb-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <p className="text-[10px] sm:text-xs font-black text-blue-400 uppercase text-center leading-relaxed">
              ⚠️ Los puntos de los suplentes, aunque se muestren aquí, no serán efectivos hasta cerrar la jornada.
            </p>
          </div>

          {/* 3. BANQUILLO Y GRADA EN ALINEACIONES */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-black/40 border border-white/10 rounded-3xl p-4">
              <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-white/50 mb-3">Banquillo Oficial</h3>
              <div className="grid grid-cols-2 gap-2">
                {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((id) => (
                  <BenchCard
                    key={id}
                    id={id}
                    player={bench[id]}
                    evaluatedPlayers={currentLineupsPoints}
                    isActive={activeSlot?.id === id}
                    onClick={() => {
                      // 🛡️ BLOQUEO EN EL BANQUILLO
                      if (countdown.targetId === lineupsMatchday) {
                        if (!isEditingLineup) {
                          alert("Pulsa el botón EDITAR ALINEACIÓN para hacer cambios.");
                          return;
                        }
                        setActiveSlot({ id, type: 'bench', pos: bench[id]?.posicion });
                      }
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-3xl p-4">
              <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-white/50 mb-3">Grada (No Convocados)</h3>
              <div className="grid grid-cols-2 gap-2">
                {['NC1', 'NC2', 'NC3', 'NC4'].map((id) => (
                  <BenchCard
                    key={id}
                    id={id}
                    player={extras[id]}
                    evaluatedPlayers={currentLineupsPoints}
                    isActive={activeSlot?.id === id}
                    onClick={() => {
                      // 🛡️ BLOQUEO EN LA GRADA
                      if (countdown.targetId === lineupsMatchday) {
                        if (!isEditingLineup) {
                          alert("Pulsa el botón EDITAR ALINEACIÓN para hacer cambios.");
                          return;
                        }
                        setActiveSlot({ id, type: 'extras', pos: extras[id]?.posicion });
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="relative z-10 mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
            <p className="text-[9px] sm:text-[10px] font-black text-yellow-500 uppercase text-center leading-relaxed">
              ⚠️ Toca a un jugador para sustituirlo por otro de su misma posición. El capitán (C) suma doble.
            </p>
          </div>
        </div>

        {/* 4. MODAL DE SUSTITUCIONES */}
        {activeSlot && (
          <div className="fixed inset-0 z-[80] bg-[#05080f]/95 backdrop-blur-md p-4 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="max-w-md w-full mx-auto flex flex-col h-full pt-16 pb-20">
              <div className="flex justify-between items-center mb-4 bg-[#1a0b0b] p-4 rounded-2xl border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                <div>
                  <h3 className="text-xl font-black italic text-blue-500 uppercase">Sustitución</h3>
                  <p className="text-xs text-white/60 font-bold uppercase">
                    Posición requerida: <span className="text-white">{activeSlot.pos || 'Cualquiera'}</span>
                  </p>
                </div>
                <button onClick={() => setActiveSlot(null)} className="bg-white/10 text-white border border-white/20 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl hover:bg-white hover:text-black transition-all active:scale-95">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pb-4 scrollbar-hide">
                {renderSubstitutionOptions()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  })()
)}
        {view === 'scores' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-6">
            
            {/* CABECERA GENERAL */}
            <h2 className="text-2xl sm:text-3xl font-black italic text-[#eab308] uppercase flex items-center gap-2 mb-2">
              🏆 CLASIFICACIÓN GENERAL
            </h2>

            {/* 1. ACORDEÓN DE USUARIOS HUMANOS (Leídos en tiempo real de Supabase) */}
            <div className="space-y-3">
              {leaderboard
                .sort((a, b) => b.total - a.total)
                .map((u, idx) => ({ ...u, pos: idx + 1 }))
                .map((u) => (
                  <details 
                    key={u.id} 
                    className={`group border rounded-2xl overflow-hidden transition-all relative ${
                      u.pos === 1 ? 'border-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.15)] bg-[#1a1c23]' :
                      u.isMe ? 'border-[#22c55e] border-2 shadow-[0_0_15px_rgba(34,197,94,0.15)] bg-[#1a2b1a]' : 
                      'border-white/10 hover:border-white/20 bg-[#0f172a]'
                    }`}
                    open={u.isMe}
                  >
                    <summary className={`flex justify-between items-center p-3 sm:p-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden ${u.pos === 1 ? 'bg-[#1a1c23]' : 'bg-[#0f172a]'}`}>
                      
                      <div className="flex items-center gap-4 sm:gap-6">
                        {/* POSICIÓN ORO, PLATA, BRONCE */}
                        <span className={`font-black italic text-3xl sm:text-4xl w-10 text-center ${
                          u.pos === 1 ? 'text-[#eab308] drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                          u.pos === 2 ? 'text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]' :
                          u.pos === 3 ? 'text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]' :
                          'text-white/20'
                        }`}>
                          #{u.pos}
                        </span>

                        {/* DATOS DEL EQUIPO */}
                        <div className="flex flex-col">
                          <h3 className={`font-black italic uppercase text-base sm:text-lg tracking-wider ${
                            u.pos === 1 ? 'text-[#eab308]' : u.isMe ? 'text-[#22c55e]' : 'text-white'
                          }`}>
                            {u.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                              <span>👤</span> {u.username}
                            </p>
                            {u.hasPaid && (
                              <span className="bg-[#eab308] text-black text-[9px] font-black rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                                5€
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-xl sm:text-2xl leading-none ${u.isMe ? 'text-[#22c55e]' : 'text-[#38bdf8]'}`}>
                            {u.total} <span className="text-sm">PTS</span>
                          </span>
                        </div>
                        <span className="text-sm group-open:rotate-180 transition-transform duration-300 text-white/40">▼</span>
                      </div>
                    </summary>
                    
                    {/* TABLA DE JUGADORES */}
                    <div className="border-t border-white/5 bg-[#0a101f]">
                      <div className="overflow-x-auto scrollbar-hide">
                      <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
  <thead className="bg-[#111827] border-b border-white/10 uppercase font-black text-[#38bdf8] text-[10px] sm:text-xs tracking-wider">
    <tr>
      {/* CABECERA: Agrupamos NOMBRE y TOTAL en un bloque que ocupará el espacio sticky */}
      <th className="p-3 sticky left-0 z-10 bg-[#111827] shadow-[5px_0_10px_rgba(0,0,0,0.3)] border-r border-white/5">
        <div className="flex items-center justify-between min-w-[200px]">
          <div className="flex gap-4"><span className="w-8">POS</span><span className="w-6">SEL</span><span>NOMBRE</span></div>
          <span className="text-white bg-[#3b82f6]/20 px-2 py-0.5 rounded ml-4">TOTAL</span>
        </div>
      </th>
      {/* RESTO DE JORNADAS */}
      {['J1', 'J2', 'J3', '16V', 'OCT', 'CUA', 'SEM', 'FIN'].map(j => (
        <th key={j} className="p-3 text-center text-white/70">{j}</th>
      ))}
    </tr>
  </thead>
  <tbody className="divide-y divide-white/5">
  {u.players.length > 0 ? (
    u.players.map((p: any, idx: number) => {
      const isCap = p.isCaptain;
      const isSold = p.isActive === false;
      
      // Obtenemos el objeto de puntos de una vez
      const scoreKey = `${p.nombre.trim()}_${p.equipo.trim()}`;
      const playerPoints = globalScores[scoreKey] || {}; 
      
      const posColors: any = { POR: 'bg-[#eab308] text-black', DEF: 'bg-[#3b82f6] text-white', MED: 'bg-[#22c55e] text-white', DEL: 'bg-[#ef4444] text-white' };
      const flagUrl = getFlag(p.equipo);
      
      const matchdays = ['J1', 'J2', 'J3', '16V', 'OCT', 'CUA', 'SEM', 'FIN'];
      
      // 🚀 FUNCIÓN LOCAL PARA APLICAR EL BONUS DEL CAPITÁN
      // Esta función garantiza la consistencia matemática en toda la tabla
      const calculateFinalPoints = (rawPoints: any) => {
          if (rawPoints === undefined || rawPoints === '-') return 0;
          const numPts = Number(rawPoints);
          if (isNaN(numPts)) return 0;
          
          // Aplicamos el bonus si es capitán y NO está vendido
          return (isCap && !isSold) ? numPts * 2 : numPts;
      };

      // 🧠 CALCULAMOS EL TOTAL CORRECTAMENTE USANDO LA FUNCIÓN DE BONUS
      const ptTot = matchdays.reduce((sum, j) => sum + calculateFinalPoints(playerPoints[j]), 0);

      // DEBUG: ESTO TE DIRÁ LA VERDAD
      console.log(`DEBUG Scores | Jugador: ${p.nombre} | isCap: ${isCap} | Total calculado (con bonus): ${ptTot}`);

      return (
        <tr key={p.id || `${scoreKey}-${idx}`} className={`transition-colors ${isSold ? 'bg-black/40 opacity-30 grayscale' : 'hover:bg-white/5 bg-[#0f172a]'}`}>
          <td className={`p-3 sticky left-0 z-10 shadow-[5px_0_10px_rgba(0,0,0,0.3)] border-r border-white/5 ${isSold ? 'bg-black/40' : 'bg-[#0f172a]'}`}>
            <div className="flex items-center justify-between min-w-[200px]">
              <div className="flex items-center gap-4">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded w-8 text-center ${isSold ? 'bg-white/10 text-white/40' : (posColors[p.posicion] || 'bg-gray-500 text-white')}`}>{p.posicion}</span>
                <span className="w-6 flex justify-center items-center">
                  {flagUrl ? <img src={flagUrl} alt={p.equipo} className="w-4 h-3 object-cover rounded-[2px]" /> : '🏳️'}
                </span>
                <span className={`font-bold truncate max-w-[100px] ${isSold ? 'line-through text-white/30' : 'text-white/90'}`}>
                  {p.nombre} {isCap && !isSold && <span className="text-[#eab308] ml-1">C</span>}
                </span>
              </div>
              {/* TOTAL AHORA ES CORRECTO */}
              <span className={`font-black text-sm ml-4 ${isSold ? 'text-white/30' : 'text-white'}`}>{ptTot}</span>
            </div>
          </td>
          
          {matchdays.map(j => {
            const rawPts = playerPoints[j];
            // 🧠 PINTAMOS LOS PUNTOS DE LA JORNADA TAMBIÉN CON EL BONUS APLICADO
            const finalPts = calculateFinalPoints(rawPts);
            const showPts = (rawPts === undefined || rawPts === '-') ? '-' : finalPts;

            return (
                <td key={j} className="p-3 text-center text-white/90 font-bold">
                  {showPts}
                </td>
            );
          })}
        </tr>
      );
    })
  ) : (
    <tr><td colSpan={9} className="p-6 text-center text-white/40 font-bold uppercase text-[10px]">No hay jugadores.</td></tr>
  )}
  </tbody>
</table>
                      </div>
                    </div>
                  </details>
                ))}
            </div>

            {/* 2. EVOLUCIÓN DEL RANKING (Dinámico y Conectado) */}
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 sm:p-6 mt-8">
               <h3 className="text-lg font-black italic text-[#eab308] uppercase mb-6 flex items-center gap-2">
                 <span>📈</span> Evolución del Ranking
               </h3>
               <div className="relative w-full h-48 sm:h-64 rounded-xl border border-white/5 bg-[#0a101f] p-4 flex items-end">
                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute inset-0 py-6 px-4 opacity-80 overflow-visible">
                    {[10, 30, 50, 70, 90].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />)}
                    
                    {/* 🧠 PINTAMOS UNA LÍNEA DINÁMICA POR CADA PARTICIPANTE */}
                    {(() => {
                      // 1. Buscamos al líder para saber el máximo de la gráfica
                      const maxPoints = Math.max(...leaderboard.map(u => u.total), 10); 
                      
                      const baseGraphMatchdays = ['J1', 'J2', 'J3', 'OCT', 'CUA', 'SEM'];
                      const baseXCoords = [0, 20, 40, 60, 80, 100];
                      
                      // 2. MAGIA: Detectamos por qué jornada vamos (buscando si ALGUIEN ha puntuado)
                      let lastActiveIdx = 0;
                      baseGraphMatchdays.forEach((j, idx) => {
                        const jornadaTienePuntos = leaderboard.some(u => 
                          u.players.some((p: any) => (Number(p.puntos?.[j]) || 0) > 0)
                        );
                        if (jornadaTienePuntos) {
                          lastActiveIdx = idx;
                        }
                      });

                      // 3. Recortamos las coordenadas a solo las jornadas disputadas
                      const activeMatchdays = baseGraphMatchdays.slice(0, lastActiveIdx + 1);
                      const activeXCoords = baseXCoords.slice(0, lastActiveIdx + 1);
                      
                      // 4. Ordenamos para que los colores correspondan al ranking real
                      const sortedBoard = [...leaderboard].sort((a, b) => b.total - a.total);

                      return sortedBoard.map((u, i) => {
                        const GRAPH_COLORS = ['#3b82f6', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6', '#6366f1', '#d946ef', '#0ea5e9'];
                        const colorIndex = u.id ? (String(u.id).charCodeAt(0) + String(u.id).charCodeAt(String(u.id).length - 1)) % GRAPH_COLORS.length : i % GRAPH_COLORS.length;
                        
                        const strokeColor = u.isMe ? '#22c55e' : 
                                            i === 0 ? '#eab308' : 
                                            i === 1 ? '#d1d5db' : 
                                            i === 2 ? '#d97706' : 
                                            GRAPH_COLORS[colorIndex];
                                            
                        const shadowColor = `${strokeColor}99`; 
                        const strokeWidth = u.isMe ? "2.5" : "1.5"; 
                        
                        // Calculamos los puntos acumulados solo hasta la jornada actual
                        // Calculamos los puntos acumulados solo hasta la jornada actual
                        let acumulado = 0;
                        const yCoords = activeMatchdays.map(j => {
                          const ptsJornada = u.players.reduce((sum: number, p: any) => sum + (Number(p.puntos?.[j]) || 0), 0);
                          acumulado += ptsJornada;
                          return 95 - (acumulado / maxPoints) * 90;
                        });

                        // 🚀 DIBUJAMOS LA LÍNEA: Extendemos el último punto 10 unidades (mitad de camino hacia la siguiente jornada)
                        const lastX = activeXCoords[activeXCoords.length - 1];
                        const lastY = yCoords[yCoords.length - 1];
                        const extendedX = Math.min(100, lastX + 10); // Aseguramos que no se salga en la final
                        
                        // Unimos todos los puntos reales y le añadimos el "bracito" extra al final
                        const dPath = yCoords.map((y, idx) => `${idx === 0 ? 'M' : 'L'}${activeXCoords[idx]},${y}`).join(' ') 
                                      + ` L${extendedX},${lastY}`;

                        return (
                          <g key={u.id}>
                            {/* Ahora la línea siempre se dibuja porque le hemos dado longitud */}
                            <path 
                              d={dPath} 
                              fill="none" 
                              stroke={strokeColor} 
                              strokeWidth={strokeWidth} 
                              strokeLinecap="round"
                              className="transition-all duration-1000" 
                              style={{ filter: `drop-shadow(0 0 3px ${shadowColor})` }} 
                            />
                            {/* Círculo en cada jornada exacta superpuesto */}
                            {yCoords.map((y, idx) => (
                              <circle key={idx} cx={activeXCoords[idx]} cy={y} r={u.isMe ? "1.5" : "1"} fill={strokeColor} className="transition-all duration-1000" />
                            ))}
                          </g>
                        );
                      });
                    })()}
                 </svg>
                 <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[8px] sm:text-[10px] text-white/40 font-bold tracking-widest uppercase">
                   <span>J1</span><span>J2</span><span>J3</span><span>OCT</span><span>CUA</span><span>SEM</span>
                 </div>
               </div>
               
               {/* 👥 LEYENDA DINÁMICA: Muestra a todos los rivales reales de la BD */}
               <div className="flex flex-wrap gap-2 mt-6 justify-center">
                 {leaderboard.map((u, i) => {
                    const GRAPH_COLORS = ['#3b82f6', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6', '#6366f1', '#d946ef', '#0ea5e9'];
                    const colorIndex = u.id ? (String(u.id).charCodeAt(0) + String(u.id).charCodeAt(String(u.id).length - 1)) % GRAPH_COLORS.length : i % GRAPH_COLORS.length;
                    
                    const bulletColor = u.isMe ? '#22c55e' : 
                                        i === 0 ? '#eab308' : 
                                        i === 1 ? '#d1d5db' : 
                                        i === 2 ? '#d97706' : 
                                        GRAPH_COLORS[colorIndex];
                                        
                    return (
                      <span key={u.id} className={`text-[9px] font-bold px-3 py-1.5 rounded-full border text-white flex items-center gap-1.5 ${
                        u.isMe ? 'bg-[#22c55e]/10 border-[#22c55e]/50' : 'bg-white/5 border-white/10'
                      }`}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bulletColor, boxShadow: `0 0 5px ${bulletColor}` }}></div> 
                        {u.name}
                      </span>
                    );
                 })}
               </div>
            </div>

            {/* 3. CLASIFICACIÓN POR JORNADA (Dinámica y Conectado) */}
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 sm:p-6 mt-6">
              <h3 className="text-lg font-black italic text-[#22c55e] uppercase mb-4 flex items-center gap-2">
                 <span>🏆</span> Clasificación por Jornada
              </h3>
              
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {['J1', 'J2', 'J3', '16V', 'OCT', 'CUA', 'SEM', 'FIN'].map((j, idx) => (
                  <button key={j} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    idx === 0 ? 'bg-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-black/40 text-white/50 border border-white/5'
                  }`}>
                    {j}
                  </button>
                ))}
              </div>

              {/* 👥 LISTADO REAL: Muestra a todos los usuarios ordenados */}
              <div className="space-y-2">
                {leaderboard
                  .sort((a, b) => b.total - a.total)
                  .map((r, idx) => (
                    <div key={r.id} className="flex justify-between items-center bg-[#111827] border border-white/5 p-3 sm:p-4 rounded-xl hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`font-black text-xl w-6 text-center ${
                          idx === 0 ? 'text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'text-white/40'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className={`font-black text-sm uppercase italic tracking-wide ${r.isMe ? 'text-[#22c55e]' : 'text-white'}`}>
                            {r.name}
                          </span>
                          <span className="text-[9px] text-white/40 font-bold uppercase">{r.username}</span>
                        </div>
                      </div>
                      <span className="font-black text-[#22c55e] text-base">{r.total} PTS</span>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        )}

  {view === 'admin' && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto space-y-6">
    
    {/* --- NUEVA SUB-NAVEGACIÓN DE TESORERÍA --- */}
<div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-2xl max-w-md mx-auto mb-6">
  {['puntos', 'partidos', 'tesoreria', 'auditoria'].map((tab) => ( // 👈 Añadido 'auditoria'
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

        {/* INYECTAR MARCADORES (Con función de reseteo) */}
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
                <MatchAdminRow 
                key={`${mId}-${results[mId]?.home_score}-${results[mId]?.away_score}`} 
                match={{
                  id: mId, 
                  home, 
                  away, 
                  home_score: results[mId]?.home_score, 
                  away_score: results[mId]?.away_score
                }}
  // 👇 AQUÍ PONES LA NUEVA VERSIÓN BLINDADA
  onSave={async (id: string, hs: number, as: number) => {
    const homeScore = Number(hs) || 0;
    const awayScore = Number(as) || 0;
  
    const { error } = await supabase
      .from('match_results')
      .upsert(
        { match_id: id, group_id: group.id, home_score: homeScore, away_score: awayScore, updated_at: new Date().toISOString() },
        { onConflict: 'match_id' }
      );
  
    if (!error) {
      // 1. Recargamos los datos frescos
      const { data } = await supabase.from('match_results').select('*');
      
      // 2. CREAMOS UN NUEVO OBJETO (Para que React detecte el cambio)
      const newMap: Record<string, any> = {};
      data?.forEach((r) => (newMap[r.match_id] = r));
      
      // 3. ACTUALIZAMOS EL ESTADO
      setResults({ ...newMap }); 
      
      console.log("Estado actualizado y refrescado");
    } else {
      alert('Error: ' + error.message);
    }
  }}
  // 👇 AQUÍ SIGUE TU CÓDIGO DE BORRADO TAL CUAL
  onDelete={async (id: string) => {
    const { error } = await supabase
      .from('match_results')
      .delete()
      .eq('match_id', id);

    if (!error) {
      const { data } = await supabase.from('match_results').select('*');
      const map: any = {};
      data?.forEach((r) => (map[r.match_id] = r));
      setResults(map);
    } else {
      alert('Error al eliminar el marcador: ' + error.message);
    }
  }}
/>
              );
            })}
          </div>
        </div>
        </div>
    )}

{adminTab === 'auditoria' && (
  <div className="animate-in fade-in duration-300">
    <div className="bg-[#1a0b0b] border border-blue-500/30 rounded-3xl p-6 shadow-2xl">
      <h2 className="text-xl font-black italic text-blue-500 uppercase tracking-tighter mb-4">
        Auditoría de Selecciones
      </h2>
      <button
        onClick={auditUnusedTeams}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase text-sm mb-6 transition-all shadow-lg active:scale-95"
      >
        {unusedTeams.length > 0 ? 'Volver a Auditar' : 'Ejecutar Auditoría'}
      </button>

      {unusedTeams.length > 0 && (
        <div className="bg-black/50 p-4 rounded-xl border border-blue-500/20">
          <p className="text-blue-400 font-bold text-xs mb-4 uppercase">
            Selecciones sin usuarios (puedes ignorar estas):
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {unusedTeams.map(team => (
              <span key={team} className="text-white/60 text-[10px] font-mono bg-white/5 px-2 py-1 rounded">
                {team}
              </span>
            ))}
          </div>
        </div>
      )}
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
              {ALL_PLAYERS.filter(p => p.equipo === adminScoreCountry).map((p) => (
                <PlayerAdminRow 
                key={`${p.nombre}_${p.equipo}`} 
                p={p} 
                savedScore={scores[`${p.nombre}_${p.equipo}`]} 
                onScoreSaved={handleScoreSaved} 
                adminMatchday={activeMatchday} 
                isMatchdayClosed={false} 
              />
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

      {/* WIDGET RELOJ MAESTRO / CUENTA ATRÁS */}
      {!countdown.expired && (
        <div className="fixed bottom-24 right-6 z-[60] bg-[#0a101f]/95 border-2 border-red-500 rounded-2xl p-3 shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md animate-in slide-in-from-right-8 duration-500">
          <p className="text-[9px] font-black text-red-500 uppercase mb-1.5 text-center tracking-widest flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            {countdown.targetId === 'J1' ? 'EL JUEGO EMPIEZA EN:' : `CIERRE ${countdown.targetName}`}
          </p>
          <div className="flex gap-2.5 text-white font-black italic items-end justify-center">
            {countdown.d > 0 && (
              <div className="text-center flex flex-col">
                <span className="text-lg leading-none">{countdown.d}</span>
                <span className="text-[7px] uppercase text-white/50 not-italic">Días</span>
              </div>
            )}
            <div className="text-center flex flex-col">
              <span className="text-lg leading-none">{countdown.h.toString().padStart(2, '0')}</span>
              <span className="text-[7px] uppercase text-white/50 not-italic">Hrs</span>
            </div>
            <span className="text-red-500/50 mb-2">:</span>
            <div className="text-center flex flex-col">
              <span className="text-lg leading-none">{countdown.m.toString().padStart(2, '0')}</span>
              <span className="text-[7px] uppercase text-white/50 not-italic">Min</span>
            </div>
            <span className="text-red-500/50 mb-2">:</span>
            <div className="text-center flex flex-col">
              <span className="text-lg leading-none text-red-500 animate-pulse">{countdown.s.toString().padStart(2, '0')}</span>
              <span className="text-[7px] uppercase text-red-500/50 not-italic">Seg</span>
            </div>
          </div>
        </div>
      )}

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

  // 🔍 DEBUG: ¡Vamos a ver qué está pasando!


  const BenchCard = ({ player, id, onClick, isActive, evaluatedPlayers }: any) => {
    const posColor = player
      ? posColors[player.posicion]
      : 'bg-white/10 text-white/30';
    
    // 🧠 LEEMOS LOS STATS USANDO EL FORMATO EXACTO DE LA BD (CON TRIM)
    const stats = (player && evaluatedPlayers) 
      ? evaluatedPlayers[`${player.nombre.trim()}_${player.equipo.trim()}`] 
      : null;
  
    const isSubbedIn = stats?.isSubbedIn; // ¿Entró al campo como salvador?
  
    // 🎨 ESTILOS DINÁMICOS
    let cardStyle = isActive
      ? 'border-white bg-white/20 scale-105 shadow-lg shadow-white/20'
      : 'border-white/10 bg-black/40 hover:bg-white/10';
  
    if (isSubbedIn && !isActive) {
      cardStyle = 'border-[#22c55e] bg-[#22c55e]/10 hover:bg-[#22c55e]/20 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
    }
  
    if (!player) cardStyle += ' border-dashed';
  
    return (
      <div
        onClick={onClick}
        // 👇 AQUÍ ESTÁ TU MAGIA 3D INTACTA
        className={`relative flex items-center justify-between p-2 rounded-xl border-2 transition-all duration-300 hover:z-50 hover:-translate-y-2 hover:scale-105 hover:[transform:perspective(800px)_rotateX(10deg)_rotateY(-10deg)] active:[transform:perspective(800px)_rotateX(-10deg)_rotateY(10deg)_scale(0.95)] hover:shadow-[0_20px_30px_rgba(34,197,94,0.4)] cursor-pointer ${cardStyle}`}
      >
        {/* 🔄 ICONO DE SUSTITUCIÓN (Estilo EF24: SVG flecha arriba con borde blanco) */}
        {isSubbedIn && (
          <div className="absolute -top-2 -right-2 bg-[#22c55e] text-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white z-20 shadow-[0_0_8px_#22c55e]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </div>
        )}
  
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
                  src={getFlag(player.equipo)}
                  alt={player.equipo}
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
  
        {/* ⭐ PUNTUACIÓN OBTENIDA (Ocultamos si es '-') */}
        {stats && stats.points !== undefined && stats.points !== '-' && (
          <div className={`text-[11px] font-black mr-1 ${
            stats.points > 0 ? 'text-[#22c55e]' : 
            stats.points < 0 ? 'text-red-500' : 
            'text-white/50'
          }`}>
             {stats.points > 0 ? `+${stats.points}` : stats.points} pts
          </div>
        )}
      </div>
    );
  };

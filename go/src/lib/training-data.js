export const MUSCLES = [
  { name: 'Chest',      mev: 8,  mav: [12, 20], mrv: 22, freq: '1.5–3x/wk', loading: '8-12 reps' },
  { name: 'Back',       mev: 10, mav: [14, 22], mrv: 25, freq: '2–4x/wk',   loading: '6-20 reps' },
  { name: 'Quads',      mev: 8,  mav: [12, 18], mrv: 20, freq: '1.5–3x/wk', loading: '8-15 reps' },
  { name: 'Hamstrings', mev: 6,  mav: [10, 16], mrv: 20, freq: '2–3x/wk',   loading: '70-85% 1RM' },
  { name: 'Glutes',     mev: 2,  mav: [4, 12],  mrv: 16, freq: '2–3x/wk',   loading: '8-12 reps' },
  { name: 'Biceps',     mev: 8,  mav: [14, 20], mrv: 26, freq: '2–6x/wk',   loading: '8-15 reps' },
  { name: 'Triceps',    mev: 6,  mav: [10, 14], mrv: 18, freq: '2–4x/wk',   loading: '6-20 reps' },
  { name: 'Rear Delts', mev: 8,  mav: [16, 22], mrv: 26, freq: '2–6x/wk',   loading: '10-12 reps' },
  { name: 'Calves',     mev: 8,  mav: [12, 16], mrv: 20, freq: '2–4x/wk',   loading: '12-16 reps' },
  { name: 'Abs',        mev: 4,  mav: [16, 20], mrv: 25, freq: '3–5x/wk',   loading: '8-20 reps' },
]

export const PLAN = [
  {
    label: 'Monday', title: 'Push', subtitle: 'Chest focus',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    exercises: [
      { name: 'Incline DB Press',          muscle: 'Chest',      sets: 4, reps: '8-12',  rir: [3, 2, 2, 1] },
      { name: 'Flat Barbell Press',        muscle: 'Chest',      sets: 3, reps: '8-10',  rir: [3, 2, 1] },
      { name: 'Cable Fly',                 muscle: 'Chest',      sets: 3, reps: '12-15', rir: [2, 1, 1] },
      { name: 'Overhead Tricep Extension', muscle: 'Triceps',    sets: 3, reps: '10-15', rir: [2, 1, 1] },
      { name: 'Lateral Raise',             muscle: 'Rear Delts', sets: 3, reps: '15-20', rir: [2, 1, 1] },
    ],
  },
  {
    label: 'Tuesday', title: 'Pull', subtitle: 'Back focus',
    muscles: ['Back', 'Biceps', 'Rear Delts'],
    exercises: [
      { name: 'Pull-Ups / Lat Pulldown', muscle: 'Back',      sets: 4, reps: '8-12',  rir: [3, 2, 2, 1] },
      { name: 'Barbell Row',             muscle: 'Back',      sets: 4, reps: '6-10',  rir: [3, 2, 1, 1] },
      { name: 'Face Pulls',              muscle: 'Rear Delts', sets: 3, reps: '15-20', rir: [2, 1, 1] },
      { name: 'Dumbbell Curl',           muscle: 'Biceps',    sets: 3, reps: '10-15', rir: [2, 2, 1] },
      { name: 'Hammer Curl',             muscle: 'Biceps',    sets: 2, reps: '10-15', rir: [2, 1] },
    ],
  },
  {
    label: 'Wednesday', title: 'Legs', subtitle: 'Quad focus',
    muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    exercises: [
      { name: 'Back Squat',           muscle: 'Quads',      sets: 4, reps: '8-12',  rir: [3, 2, 2, 1] },
      { name: 'Leg Press',            muscle: 'Quads',      sets: 3, reps: '10-15', rir: [3, 2, 1] },
      { name: 'Romanian Deadlift',    muscle: 'Hamstrings', sets: 3, reps: '8-12',  rir: [3, 2, 1] },
      { name: 'Hip Thrust',           muscle: 'Glutes',     sets: 3, reps: '10-15', rir: [2, 1, 1] },
      { name: 'Standing Calf Raise',  muscle: 'Calves',     sets: 4, reps: '12-20', rir: [2, 1, 1, 1] },
    ],
  },
  {
    label: 'Thursday', title: 'Rest', subtitle: 'Active recovery',
    muscles: [], exercises: [], rest: true,
  },
  {
    label: 'Friday', title: 'Upper', subtitle: 'Strength focus',
    muscles: ['Chest', 'Back', 'Shoulders'],
    exercises: [
      { name: 'Flat Barbell Press (heavy)', muscle: 'Chest',      sets: 4, reps: '5-8',   rir: [3, 2, 2, 1] },
      { name: 'Weighted Pull-Up',           muscle: 'Back',       sets: 4, reps: '5-8',   rir: [3, 2, 2, 1] },
      { name: 'DB Shoulder Press',          muscle: 'Rear Delts', sets: 3, reps: '8-12',  rir: [2, 2, 1] },
      { name: 'Cable Rear Delt Fly',        muscle: 'Rear Delts', sets: 3, reps: '12-15', rir: [2, 1, 1] },
      { name: 'Triceps Pushdown',           muscle: 'Triceps',    sets: 3, reps: '10-15', rir: [2, 1, 1] },
    ],
  },
  {
    label: 'Saturday', title: 'Legs', subtitle: 'Posterior focus',
    muscles: ['Hamstrings', 'Glutes', 'Quads', 'Abs'],
    exercises: [
      { name: 'Deadlift',              muscle: 'Hamstrings', sets: 4, reps: '5-8',   rir: [3, 3, 2, 1] },
      { name: 'Bulgarian Split Squat', muscle: 'Glutes',     sets: 3, reps: '8-12',  rir: [3, 2, 1] },
      { name: 'Leg Curl',              muscle: 'Hamstrings', sets: 3, reps: '10-15', rir: [2, 1, 1] },
      { name: 'Leg Extension',         muscle: 'Quads',      sets: 3, reps: '12-15', rir: [2, 1, 1] },
      { name: 'Cable Crunch',          muscle: 'Abs',        sets: 4, reps: '15-20', rir: [2, 1, 1, 1] },
    ],
  },
  {
    label: 'Sunday', title: 'Rest', subtitle: 'Rest day',
    muscles: [], exercises: [], rest: true,
  },
]

export const QUICK_QS = [
  'How long should I stay in the sauna after lifting?',
  'How many laps should I swim after my lift?',
  'Is my protein high enough for a recomp?',
  'When should I deload?',
  'My legs are sore 4 days later — too much volume?',
  'I missed two sessions this week. Should I make them up?',
]

export function getVolZone(muscleName, sets) {
  const m = MUSCLES.find(x => x.name === muscleName)
  if (!m) return 'mev'
  if (sets < m.mev) return 'below'
  if (sets <= m.mav[0]) return 'mev'
  if (sets <= m.mav[1]) return 'mav'
  return 'mrv'
}

export const ZONE_LABEL = {
  below: 'Below MEV',
  mev: 'MEV Zone',
  mav: 'MAV — Sweet Spot',
  mrv: 'At MRV',
}

export const STORAGE_KEY = 'gymshred-state-v1'

export function defaultState() {
  const vols = {}
  MUSCLES.forEach(m => { vols[m.name] = m.mev })
  return {
    week: 1,
    mesoLen: 5,
    sess: 0,
    totalSets: 0,
    vols,
    goal: ['Build muscle', 'Lose fat'],
    focus: ['Chest', 'Back', 'Quads'],
    sessionLogs: {},
  }
}

export function loadTrainingState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const saved = JSON.parse(raw)
    const def = defaultState()
    MUSCLES.forEach(m => {
      if (saved.vols?.[m.name] === undefined) saved.vols[m.name] = def.vols[m.name]
    })
    return { ...def, ...saved }
  } catch {
    return defaultState()
  }
}

export function saveTrainingState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

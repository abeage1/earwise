// progressions.js — Chord progression definitions and unlock groups

// Semitone intervals for each chord quality (used by audio.js to compute frequencies)
const CHORD_QUALITIES = {
  major:      [0, 4, 7],
  minor:      [0, 3, 7],
  dom7:       [0, 4, 7, 10],
  maj7:       [0, 4, 7, 11],
  min7:       [0, 3, 7, 10],
  diminished: [0, 3, 6],
};

// Each progression is defined as an ordered array of chord steps.
// rootOffset: semitones from the randomly chosen key root (can be negative for descending bass)
// quality: chord type key from CHORD_QUALITIES
const PROGRESSIONS = [
  {
    id: 'pop',
    name: 'Pop',
    character: 'Bright and anthemic — the most-used progression in modern pop music. That emotional dip to the minor chord is the signature.',
    chords: [
      { rootOffset: 0, quality: 'major' },   // I
      { rootOffset: 7, quality: 'major' },   // V
      { rootOffset: 9, quality: 'minor' },   // vi
      { rootOffset: 5, quality: 'major' },   // IV
    ],
    songs: [
      { title: 'Let It Be — Beatles', hint: 'C–G–Am–F' },
      { title: 'No Woman No Cry — Bob Marley', hint: 'G–D–Em–C' },
      { title: 'With or Without You — U2', hint: 'D–A–Bm–G' },
      { title: "Don't Stop Believin' — Journey", hint: 'E–B–C#m–A' },
      { title: 'Someone Like You — Adele', hint: 'A–E–F#m–D' },
    ],
  },
  {
    id: 'jazz',
    name: 'Jazz',
    character: 'Sophisticated and resolving — built from minor and dominant 7th chords that pull strongly toward home. The foundation of jazz harmony.',
    chords: [
      { rootOffset: 2, quality: 'min7' },    // ii7
      { rootOffset: 7, quality: 'dom7' },    // V7
      { rootOffset: 0, quality: 'maj7' },    // Imaj7
      { rootOffset: 9, quality: 'min7' },    // vi7 (turnaround)
    ],
    songs: [
      { title: 'Autumn Leaves', hint: 'Gm7–C7–Fmaj7 at the core of every chorus' },
      { title: 'Fly Me to the Moon', hint: 'Am7–Dm7–G7–Cmaj7' },
      { title: 'Misty', hint: 'ii–V–I colors every phrase' },
      { title: 'All the Things You Are', hint: 'classic ii–V–I resolutions throughout' },
    ],
  },
  {
    id: 'fifties',
    name: '50s',
    character: 'Nostalgic and romantic — ends on the V chord, leaving a yearning, unresolved feeling that wants to loop back.',
    chords: [
      { rootOffset: 0, quality: 'major' },   // I
      { rootOffset: 9, quality: 'minor' },   // vi
      { rootOffset: 5, quality: 'major' },   // IV
      { rootOffset: 7, quality: 'major' },   // V
    ],
    songs: [
      { title: 'Stand By Me — Ben E. King', hint: 'C–Am–F–G' },
      { title: 'Heart and Soul — Hoagy Carmichael', hint: 'C–Am–F–G' },
      { title: 'Earth Angel — The Penguins', hint: 'Eb–Cm–Ab–Bb' },
      { title: 'Every Breath You Take — The Police', hint: 'Ab–Fm–Db–Eb' },
    ],
  },
  {
    id: 'folk',
    name: 'Folk',
    character: 'Simple, grounded and fully resolved — all major chords, settles completely back home. Nothing complex, nothing unresolved.',
    chords: [
      { rootOffset: 0, quality: 'major' },   // I
      { rootOffset: 5, quality: 'major' },   // IV
      { rootOffset: 7, quality: 'major' },   // V
      { rootOffset: 0, quality: 'major' },   // I
    ],
    songs: [
      { title: 'La Bamba — Ritchie Valens', hint: 'C–F–G–C, loops endlessly' },
      { title: 'Twist and Shout — Beatles', hint: 'D–G–A–D' },
      { title: 'Louie Louie — Kingsmen', hint: 'A–D–Em–D (common variation)' },
      { title: 'Wild Thing — Troggs', hint: 'A–D–E–D' },
    ],
  },
  {
    id: 'minorpop',
    name: 'Minor Pop',
    character: 'Melancholic and familiar — same four chords as the Pop progression, but opening on the minor chord shifts the whole emotional center.',
    chords: [
      { rootOffset: 9, quality: 'minor' },   // vi (heard as i)
      { rootOffset: 5, quality: 'major' },   // IV
      { rootOffset: 0, quality: 'major' },   // I
      { rootOffset: 7, quality: 'major' },   // V
    ],
    songs: [
      { title: 'Apologize — OneRepublic', hint: 'Am–F–C–G' },
      { title: 'Somebody That I Used to Know — Gotye', hint: 'Dm–Bb–F–C' },
      { title: 'Wicked Game — Chris Isaak', hint: 'Bm–A–E–A' },
      { title: 'Animal — Neon Trees', hint: 'vi–IV–I–V throughout' },
    ],
  },
  {
    id: 'andalusian',
    name: 'Andalusian',
    character: 'Dark and ancient — a falling bass line through minor, major, major, major. The last major chord creates flamenco-like tension. Sounds instantly Mediterranean.',
    chords: [
      { rootOffset:  0, quality: 'minor' },  // i
      { rootOffset: -2, quality: 'major' },  // VII (descending)
      { rootOffset: -4, quality: 'major' },  // VI (descending)
      { rootOffset: -5, quality: 'major' },  // V  (descending, with major 3rd = tension)
    ],
    songs: [
      { title: 'Hit the Road Jack — Ray Charles', hint: 'Am–G–F–E, the descending bass is unmistakable' },
      { title: 'Stairway to Heaven (intro) — Led Zeppelin', hint: 'Am–G–F–E before the folk guitar' },
      { title: 'White Rabbit — Jefferson Airplane', hint: 'descending bass, relentless tension' },
      { title: 'Sultans of Swing — Dire Straits', hint: 'Dm–C–Bb–A at cadence points' },
    ],
  },
  {
    id: 'rock',
    name: 'Rock',
    character: "Rebellious and driving — the flat VII chord (one whole step below the root) gives it that swagger. It's a major chord that doesn't belong in the key, and that's the point.",
    chords: [
      { rootOffset:  0, quality: 'major' },  // I
      { rootOffset: 10, quality: 'major' },  // bVII
      { rootOffset:  5, quality: 'major' },  // IV
      { rootOffset:  0, quality: 'major' },  // I
    ],
    songs: [
      { title: 'Sweet Home Alabama — Lynyrd Skynyrd', hint: 'D–C–G–D, the bVII is G' },
      { title: 'La Grange — ZZ Top', hint: 'A–G–D–A boogie riff' },
      { title: 'All Along the Watchtower — Hendrix', hint: 'Am–G–F–G (minor variant)' },
      { title: 'Sympathy for the Devil — Rolling Stones', hint: 'E–D–A vamp' },
    ],
  },
  {
    id: 'blues',
    name: 'Blues',
    character: 'Gritty and soulful — every chord is a dominant 7th, which means every chord has built-in tension. Nothing fully resolves. That restlessness is the blues.',
    chords: [
      { rootOffset: 0, quality: 'dom7' },   // I7
      { rootOffset: 5, quality: 'dom7' },   // IV7
      { rootOffset: 0, quality: 'dom7' },   // I7
      { rootOffset: 7, quality: 'dom7' },   // V7
    ],
    songs: [
      { title: 'Johnny B. Goode — Chuck Berry', hint: 'G7–C7–G7–D7, all dominant 7ths' },
      { title: 'Hound Dog — Elvis Presley', hint: 'every chord is a 7th' },
      { title: 'Pride and Joy — Stevie Ray Vaughan', hint: 'E7–A7–E7–B7' },
      { title: 'Stormy Monday — T-Bone Walker', hint: 'classic slow blues 7th vamp' },
    ],
  },
];

const PROGRESSION_MAP = Object.fromEntries(PROGRESSIONS.map(p => [p.id, p]));

// Unlock order: most aurally distinct pairs first
const PROGRESSION_UNLOCK_GROUPS = [
  { progressions: ['pop', 'jazz'],            minMasteryToUnlockNext: 0.62 },
  { progressions: ['fifties', 'folk'],        minMasteryToUnlockNext: 0.62 },
  { progressions: ['minorpop', 'andalusian'], minMasteryToUnlockNext: 0.65 },
  { progressions: ['rock', 'blues'],          minMasteryToUnlockNext: 0.65 },
];

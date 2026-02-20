// storage.js — localStorage persistence

const Storage = (() => {
  const KEY_DECK        = 'earwise_deck_v1';
  const KEY_PROGRESSION = 'earwise_progression_v1';
  const KEY_CHORD_DECK  = 'earwise_chord_deck_v1';
  const KEY_CHORD_PROG  = 'earwise_chord_prog_v1';
  const KEY_PROG_DECK   = 'earwise_prog_deck_v1';
  const KEY_PROG_UNLOCK = 'earwise_prog_unlock_v1';
  const KEY_SETTINGS    = 'earwise_settings_v1';
  const KEY_STATS       = 'earwise_stats_v1';

  function save(deck, progression, chordDeck, chordProgression, progDeck, progUnlocker, settings, stats) {
    try {
      localStorage.setItem(KEY_DECK,        JSON.stringify(deck.toJSON()));
      localStorage.setItem(KEY_PROGRESSION, JSON.stringify(progression.toJSON()));
      localStorage.setItem(KEY_CHORD_DECK,  JSON.stringify(chordDeck.toJSON()));
      localStorage.setItem(KEY_CHORD_PROG,  JSON.stringify(chordProgression.toJSON()));
      localStorage.setItem(KEY_PROG_DECK,   JSON.stringify(progDeck.toJSON()));
      localStorage.setItem(KEY_PROG_UNLOCK, JSON.stringify(progUnlocker.toJSON()));
      localStorage.setItem(KEY_SETTINGS,    JSON.stringify(settings));
      localStorage.setItem(KEY_STATS,       JSON.stringify(stats));
    } catch (e) {
      console.warn('earwise: could not save to localStorage', e);
    }
  }

  function loadDeck() {
    try {
      const raw = localStorage.getItem(KEY_DECK);
      if (!raw) return null;
      return SRSDeck.fromJSON(JSON.parse(raw));
    } catch (e) {
      console.warn('earwise: could not load deck', e);
      return null;
    }
  }

  function loadProgression(deck) {
    try {
      const raw = localStorage.getItem(KEY_PROGRESSION);
      const prog = new Progression(deck);
      if (raw) prog.loadJSON(JSON.parse(raw));
      return prog;
    } catch (e) {
      console.warn('earwise: could not load progression', e);
      return new Progression(deck);
    }
  }

  function loadChordDeck() {
    try {
      const raw = localStorage.getItem(KEY_CHORD_DECK);
      if (!raw) return null;
      return ChordDeck.fromJSON(JSON.parse(raw));
    } catch (e) {
      console.warn('earwise: could not load chord deck', e);
      return null;
    }
  }

  function loadChordProgression(deck) {
    try {
      const raw = localStorage.getItem(KEY_CHORD_PROG);
      const prog = new ChordProgression(deck);
      if (raw) prog.loadJSON(JSON.parse(raw));
      return prog;
    } catch (e) {
      console.warn('earwise: could not load chord progression', e);
      return new ChordProgression(deck);
    }
  }

  function loadProgressionDeck() {
    try {
      const raw = localStorage.getItem(KEY_PROG_DECK);
      if (!raw) return null;
      return ProgressionDeck.fromJSON(JSON.parse(raw));
    } catch (e) {
      console.warn('earwise: could not load progression deck', e);
      return null;
    }
  }

  function loadProgressionUnlocker(deck) {
    try {
      const raw = localStorage.getItem(KEY_PROG_UNLOCK);
      const unlocker = new ProgressionUnlocker(deck);
      if (raw) unlocker.loadJSON(JSON.parse(raw));
      return unlocker;
    } catch (e) {
      console.warn('earwise: could not load progression unlocker', e);
      return new ProgressionUnlocker(deck);
    }
  }

  function loadSettings() {
    const defaults = {
      autoPlay: true,          // auto-play interval when question starts
      autoAdvance: false,       // auto-advance after correct answer
      showSongsOn: 'wrong',    // 'always' | 'wrong' | 'never'
      sessionSize: 20,
      directionFilter: 'all',  // 'all' | 'ascending' | 'descending' | 'harmonic'
    };
    try {
      const raw = localStorage.getItem(KEY_SETTINGS);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      return defaults;
    }
  }

  function loadStats() {
    const defaults = {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      sessionHistory: [], // last 30 sessions [{date, correct, total, newUnlocks}]
    };
    try {
      const raw = localStorage.getItem(KEY_STATS);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      return defaults;
    }
  }

  function exportJSON(deck, progression, chordDeck, chordProgression, progDeck, progUnlocker, settings, stats) {
    const data = {
      version: 3,
      exportDate: new Date().toISOString(),
      deck: deck.toJSON(),
      progression: progression.toJSON(),
      chordDeck: chordDeck.toJSON(),
      chordProgression: chordProgression.toJSON(),
      progDeck: progDeck.toJSON(),
      progUnlock: progUnlocker.toJSON(),
      settings,
      stats,
    };
    return JSON.stringify(data, null, 2);
  }

  function importJSON(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.version || !data.deck) throw new Error('Invalid earwise export file');

    const newDeck = SRSDeck.fromJSON(data.deck);
    const newProg = new Progression(newDeck);
    if (data.progression) newProg.loadJSON(data.progression);

    const newChordDeck = data.chordDeck ? ChordDeck.fromJSON(data.chordDeck) : new ChordDeck();
    const newChordProg = new ChordProgression(newChordDeck);
    if (data.chordProgression) newChordProg.loadJSON(data.chordProgression);

    const newProgDeck = data.progDeck ? ProgressionDeck.fromJSON(data.progDeck) : new ProgressionDeck();
    const newProgUnlocker = new ProgressionUnlocker(newProgDeck);
    if (data.progUnlock) newProgUnlocker.loadJSON(data.progUnlock);

    return {
      deck: newDeck,
      progression: newProg,
      chordDeck: newChordDeck,
      chordProgression: newChordProg,
      progDeck: newProgDeck,
      progUnlocker: newProgUnlocker,
      settings: data.settings || {},
      stats: data.stats || {},
    };
  }

  function clear() {
    [KEY_DECK, KEY_PROGRESSION, KEY_CHORD_DECK, KEY_CHORD_PROG,
     KEY_PROG_DECK, KEY_PROG_UNLOCK, KEY_SETTINGS, KEY_STATS]
      .forEach(k => localStorage.removeItem(k));
  }

  return {
    save, loadDeck, loadProgression, loadChordDeck, loadChordProgression,
    loadProgressionDeck, loadProgressionUnlocker,
    loadSettings, loadStats, exportJSON, importJSON, clear,
  };
})();

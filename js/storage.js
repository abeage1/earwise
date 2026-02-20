// storage.js — localStorage persistence

const Storage = (() => {
  const KEY_DECK = 'earwise_deck_v1';
  const KEY_PROGRESSION = 'earwise_progression_v1';
  const KEY_SETTINGS = 'earwise_settings_v1';
  const KEY_STATS = 'earwise_stats_v1';

  function save(deck, progression, settings, stats) {
    try {
      localStorage.setItem(KEY_DECK, JSON.stringify(deck.toJSON()));
      localStorage.setItem(KEY_PROGRESSION, JSON.stringify(progression.toJSON()));
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
      localStorage.setItem(KEY_STATS, JSON.stringify(stats));
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

  function exportJSON(deck, progression, settings, stats) {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      deck: deck.toJSON(),
      progression: progression.toJSON(),
      settings,
      stats,
    };
    return JSON.stringify(data, null, 2);
  }

  function importJSON(jsonString, deck, progression) {
    const data = JSON.parse(jsonString);
    if (!data.version || !data.deck) throw new Error('Invalid earwise export file');
    const newDeck = SRSDeck.fromJSON(data.deck);
    const newProg = new Progression(newDeck);
    if (data.progression) newProg.loadJSON(data.progression);
    return {
      deck: newDeck,
      progression: newProg,
      settings: data.settings || {},
      stats: data.stats || {},
    };
  }

  function clear() {
    localStorage.removeItem(KEY_DECK);
    localStorage.removeItem(KEY_PROGRESSION);
    localStorage.removeItem(KEY_SETTINGS);
    localStorage.removeItem(KEY_STATS);
  }

  return { save, loadDeck, loadProgression, loadSettings, loadStats, exportJSON, importJSON, clear };
})();

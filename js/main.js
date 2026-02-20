// main.js — App orchestration

const App = {
  deck: null,
  progression: null,
  settings: null,
  stats: null,
  session: null,
  currentCard: null,
  questionStartTime: null,
  seenCards: new Set(),

  init() {
    this.deck = Storage.loadDeck() || new SRSDeck();
    this.progression = Storage.loadProgression(this.deck);
    this.settings = Storage.loadSettings();
    this.stats = Storage.loadStats();
    UI.init(this);
    this._save();
  },

  startSession() {
    const newUnlocks = this.progression.checkUnlocks();
    if (newUnlocks.length > 0) this._save();

    const queue = this.progression.buildSession(this.settings.sessionSize);
    if (queue.length === 0) {
      UI.toast('No intervals to practice yet!', 'error');
      return;
    }

    this.session = {
      queue,
      index: 0,
      correct: 0,
      total: queue.length,
      masterySnapshots: {},
      newUnlocks: [],
      answeredThisSession: new Set(),
    };

    for (const card of queue) {
      if (!(card.id in this.session.masterySnapshots)) {
        this.session.masterySnapshots[card.id] = card.mastery;
      }
    }

    this.seenCards = new Set();
    this._presentQuestion();
  },

  _presentQuestion() {
    if (this.session.index >= this.session.queue.length) {
      this._endSession();
      return;
    }

    this.currentCard = this.session.queue[this.session.index];
    const card = this.currentCard;
    const isNew = card.introducedAt &&
      (Date.now() - card.introducedAt < 120 * 1000) &&
      !this.seenCards.has(card.id);

    this.seenCards.add(card.id);
    UI.renderQuestion(card, this.session.index, this.session.total, isNew);

    if (this.settings.autoPlay) {
      this._playInterval();
    }
  },

  playCurrentInterval() {
    this._playInterval();
  },

  _playInterval() {
    const interval = INTERVAL_MAP[this.currentCard.intervalId];
    this.questionStartTime = null;
    Audio.play(interval.semitones, this.currentCard.direction).then(() => {
      this.questionStartTime = Date.now();
      UI.enableAnswering();
    });
  },

  replayInterval() {
    Audio.replay();
  },

  handleAnswer(selectedIntervalId) {
    if (!this.currentCard || !this.questionStartTime) return;

    const responseMs = Date.now() - this.questionStartTime;
    const correct = selectedIntervalId === this.currentCard.intervalId;

    this.currentCard.update(correct, responseMs);

    if (correct) this.session.correct++;
    this.session.answeredThisSession.add(this.currentCard.id);

    UI.renderFeedback(correct, this.currentCard, selectedIntervalId);

    this.stats.totalQuestions++;
    if (correct) this.stats.totalCorrect++;

    this._save();

    if (correct && this.settings.autoAdvance) {
      setTimeout(() => this.nextQuestion(), 1200);
    } else {
      document.getElementById('btn-next').classList.remove('hidden');
    }
  },

  nextQuestion() {
    document.getElementById('btn-next').classList.add('hidden');
    this.session.index++;
    this._presentQuestion();
  },

  _endSession() {
    const newUnlocks = this.progression.checkUnlocks();

    const masteryChanges = Object.entries(this.session.masterySnapshots)
      .filter(([id]) => this.session.answeredThisSession.has(id))
      .map(([id, before]) => {
        const card = this.deck.cards[id];
        return {
          intervalId: card.intervalId,
          direction: card.direction,
          delta: card.mastery - before,
        };
      })
      .filter(ch => Math.abs(ch.delta) > 0.001);

    this.stats.totalSessions++;
    const today = new Date().toDateString();
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1); return d.toDateString();
    })();
    if (this.stats.lastSessionDate !== today) {
      this.stats.currentStreak = (this.stats.lastSessionDate === yesterday)
        ? this.stats.currentStreak + 1 : 1;
      this.stats.lastSessionDate = today;
    }
    this.stats.longestStreak = Math.max(this.stats.longestStreak, this.stats.currentStreak);
    this.stats.sessionHistory.push({
      date: new Date().toISOString(),
      correct: this.session.correct,
      total: this.session.total,
      newUnlocks: newUnlocks.length,
    });
    if (this.stats.sessionHistory.length > 30) this.stats.sessionHistory.shift();

    this._save();

    UI.renderSummary({
      correct: this.session.correct,
      total: this.session.total,
      newUnlocks,
      masteryChanges,
    });

    this.session = null;
  },

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this._save();
    UI.toast('Settings saved', 'success');
  },

  _save() {
    Storage.save(this.deck, this.progression, this.settings, this.stats);
  },

  resetProgress() {
    Storage.clear();
    this.deck = new SRSDeck();
    this.progression = new Progression(this.deck);
    this.settings = Storage.loadSettings();
    this.stats = Storage.loadStats();
    this.session = null;
    this._save();
    UI.renderHome();
    UI.toast('Progress reset', 'info');
  },

  exportData() {
    const json = Storage.exportJSON(this.deck, this.progression, this.settings, this.stats);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Progress exported', 'success');
  },

  importData(jsonString) {
    try {
      const result = Storage.importJSON(jsonString);
      this.deck = result.deck;
      this.progression = result.progression;
      this.settings = { ...this.settings, ...result.settings };
      this.stats = { ...this.stats, ...result.stats };
      this._save();
      UI.renderHome();
      UI.toast('Progress imported successfully', 'success');
    } catch (e) {
      UI.toast('Import failed: ' + e.message, 'error');
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());

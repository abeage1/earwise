// progression-module.js — ProgressionDeck and ProgressionUnlocker

class ProgressionDeck {
  constructor() {
    this.cards = {};
    for (const prog of PROGRESSIONS) {
      // direction is always 'listen' — no ascending/descending concept for progressions
      const card = new SRSCard(prog.id, 'listen');
      this.cards[card.id] = card;
    }
  }

  getCard(progId) {
    return this.cards[`${progId}:listen`];
  }

  activeCards() {
    return Object.values(this.cards).filter(c => !c.isLocked);
  }

  dueCards() {
    return this.activeCards().filter(c => c.isDue());
  }

  avgMastery(cards) {
    if (cards.length === 0) return 1;
    return cards.reduce((sum, c) => sum + c.mastery, 0) / cards.length;
  }

  unlock(progId) {
    const card = this.getCard(progId);
    if (card && card.isLocked) {
      card.isLocked = false;
      card.introducedAt = Date.now();
      card.dueDate = Date.now();
      return true;
    }
    return false;
  }

  toJSON() {
    return Object.fromEntries(
      Object.entries(this.cards).map(([id, c]) => [id, c.toJSON()])
    );
  }

  static fromJSON(data) {
    const deck = new ProgressionDeck();
    for (const [id, cardData] of Object.entries(data)) {
      if (deck.cards[id]) {
        deck.cards[id] = SRSCard.fromJSON(cardData);
      }
    }
    return deck;
  }
}

class ProgressionUnlocker {
  constructor(deck) {
    this.deck = deck;
    this.unlockedGroupIndex = -1;
    this._initialUnlock();
  }

  _initialUnlock() {
    if (this.unlockedGroupIndex < 0) {
      this._unlockGroup(0);
    }
  }

  _unlockGroup(groupIndex) {
    if (groupIndex >= PROGRESSION_UNLOCK_GROUPS.length) return [];
    const group = PROGRESSION_UNLOCK_GROUPS[groupIndex];
    const newUnlocks = [];
    for (const progId of group.progressions) {
      const unlocked = this.deck.unlock(progId);
      if (unlocked) newUnlocks.push({ progId });
    }
    this.unlockedGroupIndex = Math.max(this.unlockedGroupIndex, groupIndex);
    return newUnlocks;
  }

  checkUnlocks() {
    const newUnlocks = [];
    const nextGroupIndex = this.unlockedGroupIndex + 1;

    if (nextGroupIndex < PROGRESSION_UNLOCK_GROUPS.length) {
      const currentGroup = PROGRESSION_UNLOCK_GROUPS[this.unlockedGroupIndex];
      const currentGroupCards = currentGroup.progressions
        .map(id => this.deck.getCard(id))
        .filter(Boolean);

      if (currentGroupCards.length > 0) {
        const avgMastery = this.deck.avgMastery(currentGroupCards);
        if (avgMastery >= currentGroup.minMasteryToUnlockNext) {
          const unlocked = this._unlockGroup(nextGroupIndex);
          newUnlocks.push(...unlocked);
        }
      }
    }

    return newUnlocks;
  }

  buildSession(sessionSize = 20) {
    const active = this.deck.activeCards();
    if (active.length === 0) return [];

    const due    = this.deck.dueCards().sort((a, b) => a.dueDate - b.dueDate);
    const notDue = active.filter(c => !c.isDue()).sort((a, b) => a.mastery - b.mastery);
    const pool   = [...due, ...notDue];

    const queue = [];
    for (const card of pool) {
      if (queue.length >= sessionSize) break;
      queue.push(card);
    }

    let i = 0;
    while (queue.length < sessionSize && pool.length > 0) {
      queue.push(pool[i % pool.length]);
      i++;
      if (i > pool.length * 3) break;
    }

    return queue;
  }

  toJSON() {
    return { unlockedGroupIndex: this.unlockedGroupIndex };
  }

  loadJSON(data) {
    if (data && typeof data.unlockedGroupIndex === 'number') {
      this.unlockedGroupIndex = data.unlockedGroupIndex;
    }
  }
}

// progression.js — Unlock system and session planning

class Progression {
  constructor(deck) {
    this.deck = deck;
    this.unlockedGroupIndex = -1; // which ascending groups have been unlocked
    this._initialUnlock();
  }

  _initialUnlock() {
    // Always start with group 0 (P8 + P5 ascending)
    if (this.unlockedGroupIndex < 0) {
      this._unlockGroup(0);
    }
  }

  _unlockGroup(groupIndex) {
    if (groupIndex >= UNLOCK_GROUPS.length) return;
    const group = UNLOCK_GROUPS[groupIndex];
    let newUnlocks = [];
    for (const intervalId of group.intervals) {
      const unlocked = this.deck.unlock(intervalId, 'ascending');
      if (unlocked) newUnlocks.push({ intervalId, direction: 'ascending' });
    }
    this.unlockedGroupIndex = Math.max(this.unlockedGroupIndex, groupIndex);
    return newUnlocks;
  }

  // Check if we should unlock new intervals or directions. Returns array of newly unlocked cards.
  checkUnlocks() {
    const newUnlocks = [];

    // --- Check if next ascending group should unlock ---
    const nextGroupIndex = this.unlockedGroupIndex + 1;
    if (nextGroupIndex < UNLOCK_GROUPS.length) {
      const currentGroup = UNLOCK_GROUPS[this.unlockedGroupIndex];
      const currentGroupCards = currentGroup.intervals
        .map(id => this.deck.getCard(id, 'ascending'))
        .filter(Boolean);

      if (currentGroupCards.length > 0) {
        const avgMastery = this.deck.avgMastery(currentGroupCards);
        if (avgMastery >= currentGroup.minMasteryToUnlockNext) {
          const unlocked = this._unlockGroup(nextGroupIndex);
          if (unlocked) newUnlocks.push(...unlocked);
        }
      }
    }

    // --- Check descending unlocks (per interval) ---
    for (const interval of INTERVALS) {
      const ascCard = this.deck.getCard(interval.id, 'ascending');
      const descCard = this.deck.getCard(interval.id, 'descending');

      if (ascCard && !ascCard.isLocked && descCard && descCard.isLocked) {
        if (ascCard.mastery >= DIRECTION_THRESHOLDS.unlockDescending) {
          const unlocked = this.deck.unlock(interval.id, 'descending');
          if (unlocked) newUnlocks.push({ intervalId: interval.id, direction: 'descending' });
        }
      }
    }

    // --- Check harmonic unlocks (per interval) ---
    for (const interval of INTERVALS) {
      const descCard = this.deck.getCard(interval.id, 'descending');
      const harmCard = this.deck.getCard(interval.id, 'harmonic');

      if (descCard && !descCard.isLocked && harmCard && harmCard.isLocked) {
        if (descCard.mastery >= DIRECTION_THRESHOLDS.unlockHarmonic) {
          const unlocked = this.deck.unlock(interval.id, 'harmonic');
          if (unlocked) newUnlocks.push({ intervalId: interval.id, direction: 'harmonic' });
        }
      }
    }

    return newUnlocks;
  }

  // Build a session queue of cards to practice
  // Returns array of SRSCard objects in the order they'll be presented
  buildSession(sessionSize = 20) {
    const queue = [];
    const active = this.deck.activeCards();

    if (active.length === 0) return queue;

    // 1. Overdue cards first (sorted by how overdue they are)
    const due = this.deck.dueCards()
      .sort((a, b) => a.dueDate - b.dueDate);

    // 2. Non-due active cards sorted by mastery (lowest first)
    const notDue = active
      .filter(c => !c.isDue())
      .sort((a, b) => a.mastery - b.mastery);

    // Fill queue: due cards, then lowest-mastery cards
    const pool = [...due, ...notDue];

    // Fill queue from pool (due cards first, then lowest mastery)
    for (const card of pool) {
      if (queue.length >= sessionSize) break;
      queue.push(card);
    }

    // If session is smaller than sessionSize, cycle through pool again
    let i = 0;
    while (queue.length < sessionSize && pool.length > 0) {
      const card = pool[i % pool.length];
      queue.push(card);
      i++;
      if (i > pool.length * 3) break; // safety
    }

    // Shuffle slightly to avoid pure ordering cues, but keep due cards weighted early
    // Shuffle only the "repeated" portion (after the first pass)
    const firstPass = Math.min(pool.length, sessionSize);
    const rest = queue.slice(firstPass);
    shuffleArray(rest);
    return [...queue.slice(0, firstPass), ...rest];
  }

  // Summary of all interval groups and their unlock status
  getProgressSummary() {
    return UNLOCK_GROUPS.map((group, index) => {
      const cards = [];
      for (const intervalId of group.intervals) {
        for (const dir of ['ascending', 'descending', 'harmonic']) {
          const card = this.deck.getCard(intervalId, dir);
          if (card) cards.push(card);
        }
      }
      return {
        groupIndex: index,
        intervals: group.intervals,
        cards,
        unlocked: index <= this.unlockedGroupIndex,
      };
    });
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

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

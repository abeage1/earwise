// ui.js — DOM rendering and event handling

const UI = (() => {
  // ── DOM references ──────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ── State passed in from main ───────────────────────────────────────────────
  let _app = null;

  function init(app) {
    _app = app;
    _bindStaticEvents();
    renderHome();
  }

  // ── Screen routing ──────────────────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = $(id);
    if (el) el.classList.add('active');
  }

  // ── HOME / DASHBOARD ────────────────────────────────────────────────────────
  function renderHome() {
    showScreen('screen-home');
    _renderMasteryGrid();
    _renderHomeStats();
  }

  function _renderHomeStats() {
    const s = _app.stats;
    $('stat-sessions').textContent = s.totalSessions;
    $('stat-questions').textContent = s.totalQuestions;
    $('stat-accuracy').textContent = s.totalQuestions > 0
      ? Math.round(s.totalCorrect / s.totalQuestions * 100) + '%'
      : '—';
    $('stat-streak').textContent = s.currentStreak;
  }

  function _renderMasteryGrid() {
    const container = $('mastery-grid');
    if (!container) return;
    container.innerHTML = '';

    for (const interval of INTERVALS) {
      const row = document.createElement('div');
      row.className = 'mastery-row';

      const label = document.createElement('div');
      label.className = 'mastery-label';
      label.innerHTML = `<span class="short">${interval.short}</span><span class="full">${interval.name}</span>`;
      row.appendChild(label);

      const bars = document.createElement('div');
      bars.className = 'mastery-bars';

      for (const dir of ['ascending', 'descending', 'harmonic']) {
        const card = _app.deck.getCard(interval.id, dir);
        const cell = document.createElement('div');
        cell.className = 'mastery-cell';
        cell.title = `${interval.name} ${dir}`;

        if (!card || card.isLocked) {
          cell.classList.add('locked');
          cell.innerHTML = `<div class="dir-label">${_dirIcon(dir)}</div><div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>`;
        } else {
          const pct = Math.round(card.mastery * 100);
          const hue = Math.round(card.mastery * 120); // red → green
          cell.innerHTML = `
            <div class="dir-label">${_dirIcon(dir)}</div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${pct}%; background: hsl(${hue},70%,48%)"></div>
            </div>
            <div class="bar-pct">${pct}%</div>`;
        }

        bars.appendChild(cell);
      }

      row.appendChild(bars);
      container.appendChild(row);
    }
  }

  function _dirIcon(dir) {
    return dir === 'ascending' ? '↑' : dir === 'descending' ? '↓' : '⧫';
  }

  // ── SESSION / QUESTION ──────────────────────────────────────────────────────
  function renderQuestion(card, sessionIndex, sessionTotal, isNewCard) {
    showScreen('screen-question');

    // Progress bar
    const pct = Math.round((sessionIndex / sessionTotal) * 100);
    $('progress-fill').style.width = pct + '%';
    $('progress-label').textContent = `${sessionIndex} / ${sessionTotal}`;

    // Direction badge
    const dirEl = $('direction-badge');
    const interval = INTERVAL_MAP[card.intervalId];
    dirEl.textContent = _dirLabel(card.direction);
    dirEl.className = 'direction-badge dir-' + card.direction;

    // Reset feedback area
    const feedbackEl = $('feedback-area');
    feedbackEl.className = 'feedback-area hidden';
    feedbackEl.innerHTML = '';

    // New card announcement
    const newBadge = $('new-badge');
    if (isNewCard) {
      newBadge.classList.remove('hidden');
      newBadge.textContent = `New: ${interval.name} (${card.direction})`;
    } else {
      newBadge.classList.add('hidden');
    }

    // Render answer buttons (only active intervals)
    _renderAnswerButtons(card);

    // Disable buttons until audio finishes
    _setButtonsEnabled(false);
    $('btn-play').classList.remove('hidden');
    $('btn-replay').classList.add('hidden');
  }

  function _dirLabel(dir) {
    return dir === 'ascending' ? '▲ Ascending' : dir === 'descending' ? '▼ Descending' : '⧫ Harmonic';
  }

  function _renderAnswerButtons(currentCard) {
    const container = $('answer-buttons');
    container.innerHTML = '';

    // Get all unlocked interval IDs (deduplicated)
    const activeIntervalIds = [...new Set(
      _app.deck.activeCards().map(c => c.intervalId)
    )];

    // Sort by semitone count
    const sorted = INTERVALS.filter(i => activeIntervalIds.includes(i.id));

    sorted.forEach((interval, idx) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.dataset.intervalId = interval.id;
      btn.innerHTML = `
        <span class="key-hint">${idx + 1 <= 9 ? idx + 1 : idx === 9 ? '0' : ''}</span>
        <span class="interval-short">${interval.short}</span>
        <span class="interval-full">${interval.name}</span>`;

      btn.addEventListener('click', () => {
        if (!btn.disabled) _app.handleAnswer(interval.id);
      });

      container.appendChild(btn);
    });
  }

  function _setButtonsEnabled(enabled) {
    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.disabled = !enabled;
    });
    const replayBtn = $('btn-replay');
    if (replayBtn) replayBtn.disabled = !enabled;
  }

  // Called when audio finishes playing — enable answer buttons
  function enableAnswering() {
    _setButtonsEnabled(true);
    $('btn-play').classList.add('hidden');
    $('btn-replay').classList.remove('hidden');
  }

  // ── FEEDBACK after answer ───────────────────────────────────────────────────
  function renderFeedback(correct, card, selectedIntervalId) {
    // Disable answer buttons but keep replay enabled
    document.querySelectorAll('.answer-btn').forEach(btn => { btn.disabled = true; });

    const interval = INTERVAL_MAP[card.intervalId];
    const selected = INTERVAL_MAP[selectedIntervalId];

    // Highlight correct button green, wrong button red
    document.querySelectorAll('.answer-btn').forEach(btn => {
      if (btn.dataset.intervalId === card.intervalId) {
        btn.classList.add('correct');
      } else if (!correct && btn.dataset.intervalId === selectedIntervalId) {
        btn.classList.add('wrong');
      }
    });

    const feedbackEl = $('feedback-area');
    feedbackEl.className = 'feedback-area ' + (correct ? 'feedback-correct' : 'feedback-wrong');

    let html = correct
      ? `<div class="feedback-icon">✓</div><div class="feedback-text">Correct! <strong>${interval.name}</strong></div>`
      : `<div class="feedback-icon">✗</div><div class="feedback-text">The answer was <strong>${interval.name}</strong>`;

    if (!correct && selected) {
      html += ` (you chose <strong>${selected.name}</strong>)`;
    }
    if (!correct) html += `</div>`;

    // Reference songs
    const showSongs = _app.settings.showSongsOn === 'always' ||
                     (_app.settings.showSongsOn === 'wrong' && !correct);
    if (showSongs) {
      const songs = interval.songs[card.direction] || [];
      if (songs.length > 0) {
        html += `<div class="songs-section"><div class="songs-title">Reference songs:</div><ul class="songs-list">`;
        for (const song of songs) {
          html += `<li><strong>${song.title}</strong> — ${song.hint}</li>`;
        }
        html += `</ul></div>`;
      }
    }

    feedbackEl.innerHTML = html;
    feedbackEl.classList.remove('hidden');
  }

  // ── SESSION SUMMARY ─────────────────────────────────────────────────────────
  function renderSummary(sessionResult) {
    showScreen('screen-summary');

    const { correct, total, newUnlocks, masteryChanges } = sessionResult;
    const pct = total > 0 ? Math.round(correct / total * 100) : 0;

    $('summary-score').textContent = `${correct} / ${total}`;
    $('summary-pct').textContent = `${pct}%`;

    // Emoji based on score
    let emoji = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '💪' : '🔄';
    $('summary-emoji').textContent = emoji;

    // New unlocks
    const unlocksEl = $('summary-unlocks');
    if (newUnlocks && newUnlocks.length > 0) {
      unlocksEl.innerHTML = '<h3>New unlocks!</h3><ul>' +
        newUnlocks.map(u => {
          const iv = INTERVAL_MAP[u.intervalId];
          return `<li>🔓 <strong>${iv.name}</strong> ${_dirLabel(u.direction)}</li>`;
        }).join('') + '</ul>';
      unlocksEl.classList.remove('hidden');
    } else {
      unlocksEl.classList.add('hidden');
    }

    // Mastery changes
    const changesEl = $('summary-changes');
    if (masteryChanges && masteryChanges.length > 0) {
      const rows = masteryChanges
        .sort((a, b) => (b.delta) - (a.delta))
        .map(ch => {
          const iv = INTERVAL_MAP[ch.intervalId];
          const sign = ch.delta >= 0 ? '+' : '';
          const color = ch.delta >= 0 ? '#2ecc71' : '#e74c3c';
          return `<div class="change-row">
            <span>${iv.short} ${_dirIcon(ch.direction)}</span>
            <span style="color:${color}">${sign}${Math.round(ch.delta * 100)}%</span>
          </div>`;
        });
      changesEl.innerHTML = '<h3>Mastery changes</h3>' + rows.join('');
      changesEl.classList.remove('hidden');
    } else {
      changesEl.classList.add('hidden');
    }
  }

  // ── SETTINGS PANEL ──────────────────────────────────────────────────────────
  function renderSettings() {
    showScreen('screen-settings');
    const s = _app.settings;
    $('setting-autoplay').checked = s.autoPlay;
    $('setting-autoadvance').checked = s.autoAdvance;
    $('setting-songs').value = s.showSongsOn;
    $('setting-session-size').value = s.sessionSize;
  }

  function collectSettings() {
    return {
      autoPlay: $('setting-autoplay').checked,
      autoAdvance: $('setting-autoadvance').checked,
      showSongsOn: $('setting-songs').value,
      sessionSize: parseInt($('setting-session-size').value, 10),
    };
  }

  // ── STATIC EVENT BINDING ────────────────────────────────────────────────────
  function _bindStaticEvents() {
    // Nav
    $('btn-start-session').addEventListener('click', () => _app.startSession());
    $('btn-settings-home').addEventListener('click', () => renderSettings());
    $('btn-settings-save').addEventListener('click', () => {
      _app.saveSettings(collectSettings());
      renderHome();
    });
    $('btn-settings-cancel').addEventListener('click', () => renderHome());
    $('btn-play').addEventListener('click', () => _app.playCurrentInterval());
    $('btn-replay').addEventListener('click', () => _app.replayInterval());
    $('btn-next').addEventListener('click', () => _app.nextQuestion());
    $('btn-session-again').addEventListener('click', () => _app.startSession());
    $('btn-home-from-summary').addEventListener('click', () => renderHome());
    $('btn-home-from-question').addEventListener('click', () => {
      if (confirm('End this session early?')) renderHome();
    });

    // Reset confirmation
    $('btn-reset').addEventListener('click', () => {
      if (confirm('Reset ALL progress? This cannot be undone.')) {
        _app.resetProgress();
      }
    });

    // Export / Import
    $('btn-export').addEventListener('click', () => _app.exportData());
    $('btn-import').addEventListener('click', () => $('import-file').click());
    $('import-file').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => _app.importData(ev.target.result);
      reader.readAsText(file);
      e.target.value = '';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if ($('screen-question') && $('screen-question').classList.contains('active')) {
        const key = e.key;
        if (key === 'r' || key === 'R') {
          _app.replayInterval();
          return;
        }
        const num = parseInt(key, 10);
        if (!isNaN(num)) {
          const idx = num === 0 ? 9 : num - 1;
          const btns = document.querySelectorAll('.answer-btn:not(:disabled)');
          if (btns[idx]) btns[idx].click();
        }
      }
    });
  }

  // ── TOASTS ──────────────────────────────────────────────────────────────────
  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  return {
    init,
    renderHome,
    renderQuestion,
    enableAnswering,
    renderFeedback,
    renderSummary,
    renderSettings,
    toast,
    showScreen,
  };
})();

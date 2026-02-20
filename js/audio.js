// audio.js — Web Audio API engine with ADSR envelopes and piano-like timbre

const Audio = (() => {
  let ctx = null;
  let stopHandle = null;

  function getCtx() {
    if (!ctx || ctx.state === 'closed') {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  // Resume AudioContext on user gesture (call once from a click handler)
  function unlock() {
    getCtx();
  }

  // Build a piano-like tone chain: oscillator → filter → gain → destination
  function buildTone(frequency, startTime, duration, audioCtx) {
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gainNode = audioCtx.createGain();

    // Triangle wave + lowpass filter ≈ warm, mellow tone
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);

    // Low-pass filter to round off harsh overtones
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, startTime);
    filter.Q.setValueAtTime(0.8, startTime);

    // ADSR envelope
    const peak = 0.55;
    const attack = 0.015;
    const decay = 0.12;
    const sustainLevel = 0.38;
    const release = 0.25;
    const sustainEnd = Math.max(startTime + attack + decay, startTime + duration - release);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peak, startTime + attack);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attack + decay);
    gainNode.gain.setValueAtTime(sustainLevel, sustainEnd);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    return osc;
  }

  // Convert MIDI note number to frequency
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Pick a random root MIDI note such that both notes stay in range [rootMin, rootMax]
  function pickRoot(semitones, direction) {
    const low = 48;  // C3
    const high = 72; // C5

    let minRoot, maxRoot;
    if (direction === 'ascending') {
      minRoot = low;
      maxRoot = Math.min(high, 84 - semitones); // ensure top note ≤ C6
    } else if (direction === 'descending') {
      minRoot = Math.max(low, low + semitones);  // ensure bottom note ≥ C3
      maxRoot = high;
    } else {
      // harmonic — same as ascending
      minRoot = low;
      maxRoot = Math.min(high, 84 - semitones);
    }

    if (minRoot > maxRoot) minRoot = maxRoot; // safety clamp
    return Math.round(minRoot + Math.random() * (maxRoot - minRoot));
  }

  // Play an interval. Returns a Promise that resolves when audio is done.
  // direction: 'ascending' | 'descending' | 'harmonic'
  // Returns { rootMidi, intervalMidi } so caller knows what was played.
  function playInterval(semitones, direction) {
    const audioCtx = getCtx();
    const rootMidi = pickRoot(semitones, direction);
    const intervalMidi = direction === 'descending'
      ? rootMidi - semitones
      : rootMidi + semitones;

    const rootFreq = midiToFreq(rootMidi);
    const intervalFreq = midiToFreq(intervalMidi);

    const now = audioCtx.currentTime + 0.05; // small scheduling lookahead
    const noteDuration = 0.65;
    const gap = 0.15;

    let totalDuration;

    if (direction === 'harmonic') {
      // Both notes simultaneously
      buildTone(rootFreq, now, noteDuration + 0.2, audioCtx);
      buildTone(intervalFreq, now, noteDuration + 0.2, audioCtx);
      totalDuration = noteDuration + 0.2 + 0.1;
    } else {
      // Melodic: root first, then interval note
      buildTone(rootFreq, now, noteDuration, audioCtx);
      buildTone(intervalFreq, now + noteDuration + gap, noteDuration, audioCtx);
      totalDuration = noteDuration + gap + noteDuration + 0.1;
    }

    return new Promise(resolve => {
      setTimeout(resolve, totalDuration * 1000);
    });
  }

  // Replay — same as playInterval but returns immediately; caller may not need the promise
  let lastSemitones = null;
  let lastDirection = null;

  function replay() {
    if (lastSemitones !== null) {
      return playInterval(lastSemitones, lastDirection);
    }
    return Promise.resolve();
  }

  // Wrap playInterval to store last-played for replay
  function play(semitones, direction) {
    lastSemitones = semitones;
    lastDirection = direction;
    return playInterval(semitones, direction);
  }

  return { unlock, play, replay };
})();

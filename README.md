# earwise — Adaptive Interval Ear Trainer

A static HTML/JS music interval ear training app with adaptive learning, spaced repetition, and progressive interval unlocking.

## Features

- **Adaptive learning**: each interval × direction (ascending / descending / harmonic) is tracked as a separate skill with a mastery score (0–100%)
- **Spaced repetition (SM-2)**: cards you struggle with come back more often; mastered cards are scheduled at growing intervals
- **Progressive disclosure**: starts you with just 2 intervals (Octave + Perfect 5th) and unlocks new ones as you improve, in research-backed pedagogical order
- **Direction progression**: ascending → descending → harmonic unlocked per interval as mastery grows
- **Reference songs**: real, recognizable songs as mnemonics for each interval and direction
- **Keyboard shortcuts**: number keys 1–9, 0 to select answers; `R` to replay
- **Persistence**: all progress saved to localStorage; export/import JSON backups
- **No backend, no build step** — open `index.html` in any modern browser

## Interval Unlock Order

1. **Octave + Perfect 5th** (most distinctive, started immediately)
2. **Perfect 4th**
3. **Major 2nd + Minor 2nd** (stepwise motion)
4. **Major 3rd + Minor 3rd** (chord quality)
5. **Tritone** (maximally distinctive dissonance)
6. **Major 6th + Minor 6th**
7. **Minor 7th + Major 7th**

For each interval, **ascending** unlocks first, then **descending** (at 70% mastery), then **harmonic** (at 75% descending mastery).

## Running Locally

```
open index.html
```
or serve with any static file server:
```
npx serve .
```

## Roadmap

- [ ] Chord recognition module (major / minor / dim / aug / dom7 / maj7 / min7)
- [ ] Scale recognition
- [ ] Melodic dictation
- [ ] Visual staff notation (VexFlow integration)
- [ ] Mobile PWA / offline support

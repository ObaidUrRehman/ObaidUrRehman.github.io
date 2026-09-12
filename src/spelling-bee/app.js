(async function () {
  'use strict';

  /* ============================================================
     Load word data
  ============================================================ */
  let WORDS = [];
  try {
    const res = await fetch('words.json', { cache: 'no-store' });
    const data = await res.json();
    if (Array.isArray(data)) WORDS = data;
  } catch (e) {
    WORDS = [];
  }

  const dataNote = document.getElementById('dataNote');
  if (WORDS.length === 0) {
    dataNote.hidden = false;
    dataNote.textContent = 'No words loaded — add entries to words.json (word, syllables, meaning, example).';
  }

  /* ============================================================
     Progress persistence — { [word]: 'learning' | 'mastered' }
  ============================================================ */
  const PROGRESS_KEY = 'sbc-progress';
  let progress = {};
  try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch (e) { progress = {}; }

  function statusFor(word) { return progress[word] || 'new'; }
  function setStatus(word, status) {
    progress[word] = status;
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch (e) {}
  }

  function getIndexPref(key, fallbackMax) {
    let v = 0;
    try { v = parseInt(localStorage.getItem(key), 10); } catch (e) { v = 0; }
    if (!Number.isFinite(v) || v < 0) v = 0;
    if (fallbackMax > 0) v = Math.min(v, fallbackMax);
    return v;
  }
  function setIndexPref(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }

  /* ============================================================
     Elements
  ============================================================ */
  const el = (id) => document.getElementById(id);

  const gameBg = el('gameBg');
  const themeToggle = el('themeToggle');
  const variantToggle = el('variantToggle');
  const installBtn = el('installBtn');

  const learnedNumEl = el('learnedNum');
  const masteredNumEl = el('masteredNum');
  const countdownNumEl = el('countdownNum');
  const countdownLblEl = el('countdownLbl');
  const hiveEl = el('hive');
  const openLearnBtn = el('openLearnBtn');
  const openTestBtn = el('openTestBtn');

  const learnPanel = el('learnPanel');
  const testPanel = el('testPanel');
  const learnProgressEl = el('learnProgress');
  const learnPrevBtn = el('learnPrevBtn');
  const learnNextBtn = el('learnNextBtn');
  const learnEmptyState = el('learnEmptyState');
  const flipCard = el('flipCard');
  const flipInner = el('flipInner');
  const learnWordEl = el('learnWord');
  const learnSyllablesEl = el('learnSyllables');
  const learnMeaningEl = el('learnMeaning');
  const learnExampleEl = el('learnExample');
  const hearWordBtn = el('hearWordBtn');
  const hearSyllablesBtn = el('hearSyllablesBtn');
  const hearMeaningBtn = el('hearMeaningBtn');

  const testProgressEl = el('testProgress');
  const testPrevBtn = el('testPrevBtn');
  const testNextBtn = el('testNextBtn');
  const testEmptyState = el('testEmptyState');
  const testCard = el('testCard');
  const playRing = el('playRing');
  const playSentenceBtn = el('playSentenceBtn');
  const micRing = el('micRing');
  const micLabel = el('micLabel');
  const transcript = el('transcript');
  const transcriptPlaceholder = el('transcriptPlaceholder');
  const typeInsteadBtn = el('typeInsteadBtn');
  const typeFallback = el('typeFallback');
  const typedDisplay = el('typedDisplay');
  const typedPlaceholder = el('typedPlaceholder');
  const kbGrid = el('kbGrid');
  const kbBackspace = el('kbBackspace');
  const typeSubmitBtn = el('typeSubmitBtn');
  const revealWord = el('revealWord');
  const feedbackCorrect = el('feedbackCorrect');
  const feedbackCorrectSub = el('feedbackCorrectSub');
  const feedbackWrong = el('feedbackWrong');
  const nextWordBtn = el('nextWordBtn');
  const tryAgainBtn = el('tryAgainBtn');

  const variantOverlay = el('variantOverlay');
  const confettiCanvas = el('confettiCanvas');
  const confettiCtx = confettiCanvas.getContext('2d');

  /* ============================================================
     Dashboard: stats, hive, countdown
  ============================================================ */
  function renderStats() {
    const total = WORDS.length;
    const learningCount = WORDS.filter((w) => statusFor(w.word) !== 'new').length;
    const masteredCount = WORDS.filter((w) => statusFor(w.word) === 'mastered').length;
    learnedNumEl.textContent = learningCount + '/' + total;
    masteredNumEl.textContent = masteredCount + '/' + total;

    const readyCount = WORDS.filter((w) => statusFor(w.word) !== 'new').length;
    openTestBtn.textContent = '📝 Test' + (total ? ' (' + readyCount + ' ready)' : '');
    openTestBtn.disabled = readyCount === 0;
    openLearnBtn.disabled = total === 0;
  }

  function renderHive() {
    hiveEl.innerHTML = '';
    WORDS.forEach((w, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'hex ' + statusFor(w.word);
      d.setAttribute('aria-label', w.word + ' — ' + statusFor(w.word));
      d.addEventListener('click', () => {
        learnIndex = i;
        setIndexPref('sbc-learn-index', learnIndex);
        openPanel('learn');
      });
      hiveEl.appendChild(d);
    });
  }

  function renderDashboard() {
    renderStats();
    renderHive();
  }

  function renderCountdown() {
    const competitionDate = new Date('2026-09-16T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysLeft = Math.round((competitionDate - today) / msPerDay);
    if (daysLeft > 0) {
      countdownNumEl.textContent = daysLeft;
      countdownLblEl.textContent = daysLeft === 1 ? 'Day to Bee Day' : 'Days to Bee Day';
    } else if (daysLeft === 0) {
      countdownNumEl.textContent = '🏆';
      countdownLblEl.textContent = "It's Bee Day!";
    } else {
      countdownNumEl.textContent = '✓';
      countdownLblEl.textContent = 'Bee Day has passed';
    }
  }
  renderCountdown();

  /* ============================================================
     Panel navigation (dashboard / learn / test)
  ============================================================ */
  function openPanel(which) {
    learnPanel.classList.remove('open');
    testPanel.classList.remove('open');
    if (which === 'learn') {
      learnPanel.classList.add('open');
      renderLearnCard();
    } else if (which === 'test') {
      testPanel.classList.add('open');
      rebuildTestQueue();
      renderTestCard();
    }
  }
  openLearnBtn.addEventListener('click', () => openPanel('learn'));
  openTestBtn.addEventListener('click', () => openPanel('test'));
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      learnPanel.classList.remove('open');
      testPanel.classList.remove('open');
      speechSynthesis && speechSynthesis.cancel();
      renderDashboard();
    });
  });

  /* ============================================================
     Speech synthesis (TTS)
  ============================================================ */
  const ttsSupported = 'speechSynthesis' in window;

  // Some platforms (notably macOS) bundle "novelty" voices (Albert, Zarvox,
  // Trinoids, ...) alongside normal ones. Leaving voice selection to the
  // browser's own lang-matching can land on one of those instead of a plain
  // voice, so pick explicitly rather than just setting utter.lang.
  const NOVELTY_VOICE_NAMES = ['Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Good News', 'Jester', 'Organ', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox', 'Kathy', 'Fred', 'Junior', 'Ralph', 'Hysterical', 'Princess'];
  const PREFERRED_VOICE_NAMES = ['Samantha', 'Ava', 'Nicky', 'Susan', 'Allison', 'Victoria', 'Karen', 'Daniel', 'Moira', 'Tessa', 'Serena', 'Kate'];
  // Picked fresh at speak-time rather than cached at load: getVoices() can
  // still be empty the instant this script runs (the list loads async), and
  // Chrome doesn't reliably re-fire 'voiceschanged' afterward — caching a
  // stale null here silently fell back to the browser's own default voice.
  function pickVoice() {
    if (!ttsSupported) return null;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    const english = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    const pool = english.length ? english : voices;
    const clean = pool.filter((v) => !NOVELTY_VOICE_NAMES.includes(v.name));
    const candidates = clean.length ? clean : pool;
    for (const name of PREFERRED_VOICE_NAMES) {
      const match = candidates.find((v) => v.name === name);
      if (match) return match;
    }
    const enUS = candidates.find((v) => v.lang === 'en-US');
    return enUS || candidates[0] || voices[0];
  }

  function speakSequence(parts, rate, onEnd) {
    if (!ttsSupported) {
      if (onEnd) onEnd();
      return;
    }
    try {
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(parts.join(', '));
      utter.rate = rate || 0.95;
      const voice = pickVoice();
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = 'en-US';
      }
      speechSynthesis.speak(utter);
      if (onEnd) utter.addEventListener('end', onEnd, { once: true });
    } catch (e) {
      if (onEnd) onEnd();
    }
  }

  // Plays a pre-generated clip from assets/audio/<id>.mp3 when one exists
  // (cached once via the ElevenLabs voice, at no runtime API cost) and
  // falls back to the browser TTS voice above for anything not pre-generated
  // or if playback fails for any reason (offline, missing file, etc).
  let currentCachedAudio = null;
  function speakCached(id, fallbackParts, rate, onEnd) {
    if (currentCachedAudio) {
      currentCachedAudio.pause();
      currentCachedAudio = null;
    }
    if (ttsSupported) speechSynthesis.cancel();
    let settled = false;
    function fallback() {
      if (settled) return;
      settled = true;
      speakSequence(fallbackParts, rate, onEnd);
    }
    try {
      const audio = new Audio('assets/audio/' + id + '.mp3');
      currentCachedAudio = audio;
      audio.addEventListener('ended', () => {
        settled = true;
        if (onEnd) onEnd();
      });
      audio.addEventListener('error', fallback);
      const playPromise = audio.play();
      if (playPromise && playPromise.catch) playPromise.catch(fallback);
    } catch (e) {
      fallback();
    }
  }

  /* ============================================================
     Learn mode
  ============================================================ */
  let learnIndex = getIndexPref('sbc-learn-index', WORDS.length - 1);

  // Shrinks an element's font-size (from its current CSS size down to minPx)
  // until its content fits on one line, instead of letting long words wrap.
  function fitTextToOneLine(elem, minPx) {
    if (!elem || !elem.textContent) return;
    elem.style.fontSize = '';
    let size = parseFloat(getComputedStyle(elem).fontSize);
    const floor = minPx || 22;
    elem.style.fontSize = size + 'px';
    while (size > floor && elem.scrollWidth > elem.clientWidth) {
      size -= 2;
      elem.style.fontSize = size + 'px';
    }
  }
  let resizeFitTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeFitTimer);
    resizeFitTimer = setTimeout(() => {
      if (learnWordEl.textContent) fitTextToOneLine(learnWordEl, 22);
      if (!revealWord.hidden && revealWord.textContent) fitTextToOneLine(revealWord, 18);
    }, 150);
  });

  function renderLearnCard() {
    const total = WORDS.length;
    if (total === 0) {
      learnEmptyState.hidden = false;
      flipCard.style.display = 'none';
      learnProgressEl.textContent = 'Word 0 of 0';
      return;
    }
    learnEmptyState.hidden = true;
    flipCard.style.display = '';
    if (learnIndex >= total) learnIndex = total - 1;
    if (learnIndex < 0) learnIndex = 0;
    flipInner.classList.remove('flipped');
    const w = WORDS[learnIndex];
    learnWordEl.textContent = w.word;
    fitTextToOneLine(learnWordEl, 22);
    learnSyllablesEl.innerHTML = (w.syllables || [w.word]).join('&nbsp;•&nbsp;');
    learnMeaningEl.textContent = w.meaning || '';
    learnExampleEl.textContent = w.example ? '"' + w.example + '"' : '';
    learnProgressEl.textContent = 'Word ' + (learnIndex + 1) + ' of ' + total;
  }

  function stepLearn(delta) {
    if (WORDS.length === 0) return;
    learnIndex = (learnIndex + delta + WORDS.length) % WORDS.length;
    setIndexPref('sbc-learn-index', learnIndex);
    renderLearnCard();
  }
  learnPrevBtn.addEventListener('click', () => stepLearn(-1));
  learnNextBtn.addEventListener('click', () => stepLearn(1));

  document.querySelectorAll('.flip-btn').forEach((btn) => {
    btn.addEventListener('click', () => flipInner.classList.toggle('flipped'));
  });

  hearWordBtn.addEventListener('click', () => {
    const w = WORDS[learnIndex];
    if (w) speakCached(w.word + '-word', [w.word]);
  });
  hearSyllablesBtn.addEventListener('click', () => {
    const w = WORDS[learnIndex];
    if (w) speakCached(w.word + '-syllables', w.syllables && w.syllables.length ? w.syllables : [w.word], 0.85);
  });
  hearMeaningBtn.addEventListener('click', () => {
    const w = WORDS[learnIndex];
    if (w && w.meaning) speakCached(w.word + '-meaning', [w.meaning]);
  });

  document.querySelectorAll('.learned-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const w = WORDS[learnIndex];
      if (!w) return;
      if (statusFor(w.word) !== 'mastered') setStatus(w.word, 'learning');
      celebrate();
      setTimeout(() => {
        renderDashboard();
        stepLearn(1);
      }, 850);
    });
  });

  /* ============================================================
     Test mode
  ============================================================ */
  let testQueue = [];
  let testPos = 0;

  function rebuildTestQueue() {
    testQueue = WORDS.map((w, i) => i).filter((i) => statusFor(WORDS[i].word) !== 'new');
    testPos = getIndexPref('sbc-test-pos', testQueue.length - 1);
    if (testPos >= testQueue.length) testPos = 0;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const sttSupported = !!SR;
  let recognition = null;
  if (sttSupported) {
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
  } else {
    typeFallback.hidden = false;
    typeInsteadBtn.hidden = true;
    micLabel.textContent = 'Voice input isn\'t supported here — type the spelling below';
  }

  let answered = false;
  let wordPlaying = false;
  let playTimeoutId = null;
  let recognizing = false;

  function currentTestWord() {
    if (!testQueue.length) return null;
    return WORDS[testQueue[testPos]];
  }

  function fillTranscript(guess, actual) {
    transcript.innerHTML = '';
    const upperGuess = guess.toUpperCase();
    const upperActual = actual.toUpperCase();
    const len = Math.max(upperGuess.length, upperActual.length);
    for (let i = 0; i < len; i++) {
      const letter = upperGuess[i] || '·';
      const tile = document.createElement('div');
      tile.className = 'tile ' + (upperGuess[i] && upperGuess[i] === upperActual[i] ? 'hit' : 'miss');
      tile.textContent = letter;
      transcript.appendChild(tile);
    }
  }

  function normalizeGuess(raw) {
    return (raw || '').toUpperCase().replace(/[^A-Z]/g, '');
  }

  // On-screen A-Z keyboard, built once — used instead of a native text
  // input so a kid's device keyboard (with its own autocorrect/spell-check,
  // which spellcheck="false" doesn't reliably suppress on mobile) can't
  // interfere with a spelling test.
  let typedBuffer = [];
  const MAX_TYPED_LETTERS = 24;
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => {
    const key = document.createElement('button');
    key.type = 'button';
    key.className = 'icon-btn kb-key';
    key.textContent = letter;
    key.setAttribute('aria-label', 'Letter ' + letter);
    key.addEventListener('click', () => {
      if (typedBuffer.length >= MAX_TYPED_LETTERS) return;
      typedBuffer.push(letter);
      renderTypedDisplay();
    });
    kbGrid.appendChild(key);
  });
  function renderTypedDisplay() {
    typedDisplay.innerHTML = '';
    if (!typedBuffer.length) {
      typedDisplay.appendChild(typedPlaceholder);
      return;
    }
    typedBuffer.forEach((letter) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.textContent = letter;
      typedDisplay.appendChild(tile);
    });
  }
  function clearTypedBuffer() {
    typedBuffer = [];
    renderTypedDisplay();
  }
  kbBackspace.addEventListener('click', () => {
    typedBuffer.pop();
    renderTypedDisplay();
  });

  function playWordAudio() {
    const w = currentTestWord();
    if (!w) return;
    if (playTimeoutId) clearTimeout(playTimeoutId);
    wordPlaying = true;
    playRing.classList.add('speaking');
    micRing.classList.add('disabled');
    micLabel.textContent = '🔊 Listen carefully…';
    let finished = false;
    function onWordDone() {
      if (finished) return;
      finished = true;
      if (playTimeoutId) clearTimeout(playTimeoutId);
      playRing.classList.remove('speaking');
      wordPlaying = false;
      if (!answered) {
        micRing.classList.remove('disabled');
        micLabel.textContent = sttSupported ? 'Tap and spell it out loud' : 'Type the spelling below';
      }
    }
    speakCached(w.word + '-word', [w.word], undefined, onWordDone);
    // Safety net in case neither the audio 'ended' nor speech 'end' event
    // fires (e.g. a browser quirk) — estimate a generous upper bound so the
    // mic never stays stuck disabled.
    const estimatedMs = Math.max(1500, w.word.length * 220);
    playTimeoutId = setTimeout(onWordDone, estimatedMs);
  }
  playRing.addEventListener('click', playWordAudio);
  playSentenceBtn.addEventListener('click', () => {
    const w = currentTestWord();
    if (w && w.example) speakCached(w.word + '-example', [w.example]);
  });

  function resetTestCard() {
    if (playTimeoutId) clearTimeout(playTimeoutId);
    answered = false;
    wordPlaying = false;
    recognizing = false;
    playRing.classList.remove('speaking');
    micRing.classList.remove('disabled', 'listening');
    transcript.hidden = true;
    transcript.innerHTML = '';
    transcriptPlaceholder.hidden = false;
    revealWord.hidden = true;
    feedbackCorrect.hidden = true;
    feedbackWrong.hidden = true;
    nextWordBtn.hidden = true;
    tryAgainBtn.hidden = true;
    clearTypedBuffer();
    if (!sttSupported) typeFallback.hidden = false;
    micLabel.textContent = sttSupported ? 'Tap and spell it out loud' : 'Type the spelling below';
  }

  function renderTestCard() {
    if (!testQueue.length) {
      testEmptyState.hidden = false;
      testCard.style.display = 'none';
      testProgressEl.textContent = 'Word 0 of 0';
      return;
    }
    testEmptyState.hidden = true;
    testCard.style.display = '';
    testProgressEl.textContent = 'Word ' + (testPos + 1) + ' of ' + testQueue.length + ' to review';
    resetTestCard();
    playWordAudio();
  }

  function evaluateAnswer(rawGuess) {
    const w = currentTestWord();
    if (!w || answered) return;
    answered = true;
    const guess = normalizeGuess(rawGuess);
    const actual = w.word.toUpperCase();
    transcriptPlaceholder.hidden = true;
    transcript.hidden = false;
    typeFallback.hidden = sttSupported ? true : false;
    fillTranscript(guess, actual);
    if (guess === actual) {
      micLabel.textContent = 'Great job!';
      revealWord.textContent = w.word;
      revealWord.hidden = false;
      fitTextToOneLine(revealWord, 18);
      const wasMastered = statusFor(w.word) === 'mastered';
      setStatus(w.word, 'mastered');
      feedbackCorrectSub.textContent = wasMastered
        ? 'Still mastered — nicely done again!'
        : 'Moved to Mastered — next word coming up.';
      feedbackCorrect.hidden = false;
      nextWordBtn.hidden = false;
      renderDashboard();
      celebrate();
    } else {
      micLabel.textContent = 'Not quite — try again';
      feedbackWrong.hidden = false;
      tryAgainBtn.hidden = false;
      playBuzz();
      shakeCard(testCard);
    }
  }

  if (sttSupported) {
    recognition.addEventListener('result', (event) => {
      recognizing = false;
      const alternatives = Array.from(event.results[0]).map((r) => r.transcript);
      evaluateAnswer(alternatives[0] || '');
    });
    recognition.addEventListener('error', () => {
      recognizing = false;
      if (!answered) {
        micRing.classList.remove('listening');
        micLabel.textContent = "Didn't catch that — try again or type it";
      }
    });
    recognition.addEventListener('end', () => {
      if (recognizing) {
        recognizing = false;
        if (!answered) {
          micRing.classList.remove('listening');
          micLabel.textContent = 'Tap and spell it out loud';
        }
      }
    });
  }

  micRing.addEventListener('click', () => {
    if (answered || wordPlaying || !currentTestWord()) return;
    if (!sttSupported) {
      micRing.classList.remove('pop');
      void micRing.offsetWidth;
      micRing.classList.add('pop');
      typeFallback.hidden = false;
      return;
    }
    recognizing = true;
    micRing.classList.remove('pop');
    void micRing.offsetWidth;
    micRing.classList.add('pop', 'listening');
    micLabel.textContent = 'Listening… spell it now!';
    playListenCue();
    try { recognition.start(); } catch (e) { recognizing = false; }
  });

  typeInsteadBtn.addEventListener('click', () => {
    typeFallback.hidden = !typeFallback.hidden;
  });
  function submitTyped() {
    if (!typedBuffer.length) return;
    evaluateAnswer(typedBuffer.join(''));
  }
  typeSubmitBtn.addEventListener('click', submitTyped);

  function goToTest(delta) {
    if (!testQueue.length) return;
    testPos = (testPos + delta + testQueue.length) % testQueue.length;
    setIndexPref('sbc-test-pos', testPos);
    renderTestCard();
  }
  nextWordBtn.addEventListener('click', () => goToTest(1));
  tryAgainBtn.addEventListener('click', resetTestCard);
  testNextBtn.addEventListener('click', () => goToTest(1));
  testPrevBtn.addEventListener('click', () => goToTest(-1));

  /* ============================================================
     Celebration: chime / buzz / confetti (flavor follows the variant)
  ============================================================ */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let audioCtx;
  const SOUND_PARAMS = {
    a: { chimeType: 'sine', chimeStep: 0.09 },
    b: { chimeType: 'square', chimeStep: 0.07 },
    c: { chimeType: 'sine', chimeStep: 0.11 },
    d: { chimeType: 'triangle', chimeStep: 0.08 },
    e: { chimeType: 'triangle', chimeStep: 0.08 },
  };
  const CONFETTI_PALETTES = {
    a: ['#F2A62B', '#E08E00', '#3FA34D', '#E0592A', '#7A4B00'],
    b: ['#39E6C0', '#7CFF6B', '#FF5C8A', '#FFD166', '#8C6BFF'],
    c: ['#C1622D', '#4C7A4E', '#B23A3A', '#D9A441', '#6C7DA8'],
    d: ['#E2231A', '#00A651', '#FFC800', '#1E90FF'],
    e: ['#E2231A', '#00A651', '#FFC800', '#1E90FF'],
  };

  function playChime() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const params = SOUND_PARAMS[currentVariant];
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = params.chimeType;
        osc.frequency.value = freq;
        const start = now + i * params.chimeStep;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch (e) {}
  }

  // A loud, unmistakable "sad trombone" fail sting — three descending notes,
  // each with a comedic downward slide, the last one held and wobbling.
  // Synthesized from scratch (an old vaudeville melodic gag, not a sampled
  // meme clip) so it's free to use and deliberately louder/goofier than the
  // rest of the app's sounds — same for every visual style, on purpose.
  function playBuzz() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const notes = [
        { freq: 440.00, glideTo: 415.30, start: 0.00, dur: 0.22, gain: 0.28 },
        { freq: 349.23, glideTo: 329.63, start: 0.20, dur: 0.22, gain: 0.30 },
        { freq: 277.18, glideTo: 246.94, start: 0.40, dur: 0.62, gain: 0.34 },
      ];
      notes.forEach((n, i) => {
        const start = now + n.start;
        const end = start + n.dur;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.freq, start);
        osc.frequency.exponentialRampToValueAtTime(n.glideTo, end);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(n.gain, start + 0.03);
        gain.gain.setValueAtTime(n.gain, end - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
        if (i === notes.length - 1) {
          const vibrato = audioCtx.createOscillator();
          const vibratoGain = audioCtx.createGain();
          vibrato.frequency.value = 7;
          vibratoGain.gain.value = 8;
          vibrato.connect(vibratoGain).connect(osc.frequency);
          vibrato.start(start + 0.08);
          vibrato.stop(end + 0.02);
        }
      });
    } catch (e) {}
  }

  // Short two-note "go ahead" chirp played the instant the mic starts
  // listening, so it's clear (by ear, not just the label text) that it's
  // time to start spelling.
  function playListenCue() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      [660, 880].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.1;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.16, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch (e) {}
  }

  function burstConfetti() {
    if (prefersReducedMotion) return;
    const confettiColors = CONFETTI_PALETTES[currentVariant];
    const dpr = window.devicePixelRatio || 1;
    confettiCanvas.width = window.innerWidth * dpr;
    confettiCanvas.height = window.innerHeight * dpr;
    confettiCanvas.style.width = window.innerWidth + 'px';
    confettiCanvas.style.height = window.innerHeight + 'px';
    confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    confettiCanvas.style.display = 'block';

    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.3,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    }));

    const duration = 1600;
    const startTime = performance.now();
    function frame(now) {
      const elapsed = now - startTime;
      confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.rot += p.vr;
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate(p.rot);
        confettiCtx.fillStyle = p.color;
        confettiCtx.globalAlpha = Math.max(0, 1 - elapsed / duration);
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confettiCtx.restore();
      });
      if (elapsed < duration) requestAnimationFrame(frame);
      else {
        confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        confettiCanvas.style.display = 'none';
      }
    }
    requestAnimationFrame(frame);
  }
  function celebrate() { playChime(); burstConfetti(); }

  function shakeCard(cardEl) {
    if (prefersReducedMotion) return;
    cardEl.classList.remove('shake');
    void cardEl.offsetWidth;
    cardEl.classList.add('shake');
    setTimeout(() => cardEl.classList.remove('shake'), 400);
  }

  /* ============================================================
     Theme (system/light/dark) + Variant (A–E) — palette driven
  ============================================================ */
  const PALETTES = {
    a: {
      light: { ground: '#FFFBF2', surface: '#FFFFFF', 'surface-2': '#FFF3DC', ink: '#2B2440', 'ink-soft': '#6B6280', accent: '#F2A62B', 'accent-ink': '#7A4B00', 'accent-strong': '#E08E00', 'accent-on-surface': '#7A4B00', good: '#3FA34D', 'good-bg': '#E3F5E6', warn: '#E0592A', 'warn-bg': '#FCE7DE', line: '#EFE2C6', shadow: 'rgba(43,36,64,0.10)' },
      dark: { ground: '#1C1730', surface: '#26203F', 'surface-2': '#332A52', ink: '#F4EFE4', 'ink-soft': '#B8AFCB', accent: '#F5B646', 'accent-ink': '#2E1D00', 'accent-strong': '#FFC968', 'accent-on-surface': '#FFC968', good: '#6BCB77', 'good-bg': '#23422B', warn: '#FF8360', 'warn-bg': '#4A2418', line: '#3A3258', shadow: 'rgba(0,0,0,0.4)' },
    },
    b: {
      light: { ground: '#EDEBE3', surface: '#FFFFFF', 'surface-2': '#E4E1D3', ink: '#141522', 'ink-soft': '#5B5C72', accent: '#0E9A85', 'accent-ink': '#F5FFFC', 'accent-strong': '#0C7A69', 'accent-on-surface': '#0E9A85', good: '#2E9E3B', 'good-bg': '#DFF3E1', warn: '#D63A63', 'warn-bg': '#FBE0E7', line: '#D8D4C2', shadow: 'rgba(20,21,34,0.14)' },
      dark: { ground: '#0F1226', surface: '#1B2044', 'surface-2': '#262C58', ink: '#EAF0FF', 'ink-soft': '#8C93C4', accent: '#39E6C0', 'accent-ink': '#04211C', 'accent-strong': '#0FBF9B', 'accent-on-surface': '#39E6C0', good: '#7CFF6B', 'good-bg': '#163321', warn: '#FF5C8A', 'warn-bg': '#3A1330', line: '#333B72', shadow: 'rgba(0,0,0,0.5)' },
    },
    c: {
      light: { ground: '#F1E6CF', surface: '#FFFDF6', 'surface-2': '#FBE9BE', ink: '#3B2E22', 'ink-soft': '#8A7A63', accent: '#C1622D', 'accent-ink': '#FFF8EE', 'accent-strong': '#9C4A1E', 'accent-on-surface': '#9C4A1E', good: '#4C7A4E', 'good-bg': '#E4EEDD', warn: '#B23A3A', 'warn-bg': '#F6DCDA', line: '#E3D6B8', shadow: 'rgba(59,46,34,0.14)' },
      dark: { ground: '#221B14', surface: '#2E2419', 'surface-2': '#3B2E1F', ink: '#F1E6D2', 'ink-soft': '#B9A98C', accent: '#E08A55', 'accent-ink': '#2E1400', 'accent-strong': '#F2A876', 'accent-on-surface': '#E08A55', good: '#8FBF7A', 'good-bg': '#2C3B22', warn: '#E07A72', 'warn-bg': '#43241F', line: '#4A3D2C', shadow: 'rgba(0,0,0,0.45)' },
    },
    d: {
      light: { ground: '#F2F4F7', surface: '#FFFFFF', 'surface-2': '#E8EBF0', ink: '#1F2733', 'ink-soft': '#6B7684', accent: '#E2231A', 'accent-ink': '#FFFFFF', 'accent-strong': '#B81810', 'accent-on-surface': '#C41B12', good: '#00A651', 'good-bg': '#DFF6E7', warn: '#FF7A1A', 'warn-bg': '#FFE9D6', line: '#DDE1E8', shadow: 'rgba(31,39,51,0.14)' },
      dark: { ground: '#15181D', surface: '#1E2229', 'surface-2': '#272C35', ink: '#EDEFF3', 'ink-soft': '#9AA3B0', accent: '#FF3B30', 'accent-ink': '#1A0402', 'accent-strong': '#FF6259', 'accent-on-surface': '#FF6259', good: '#2ED573', 'good-bg': '#123625', warn: '#FFA057', 'warn-bg': '#3A2410', line: '#333A46', shadow: 'rgba(0,0,0,0.5)' },
    },
    e: {
      light: { ground: '#BEEBFF', surface: 'rgba(255,255,255,0.82)', 'surface-2': 'rgba(255,255,255,0.55)', ink: '#1F2733', 'ink-soft': '#48505C', accent: '#E2231A', 'accent-ink': '#FFFFFF', 'accent-strong': '#B81810', 'accent-on-surface': '#C41B12', good: '#00A651', 'good-bg': 'rgba(0,166,81,0.18)', warn: '#FF7A1A', 'warn-bg': 'rgba(255,122,26,0.2)', line: 'rgba(31,39,51,0.18)', shadow: 'rgba(15,23,42,0.25)', 'sky-top': '#5EC8F2', 'sky-bottom': '#BEEBFF', 'terrain-top': '#5FD576', 'terrain-bottom': '#3D8B4E', celestial: '#FFE66D', 'celestial-glow': 'rgba(255,230,109,.55)' },
      dark: { ground: '#0B1330', surface: 'rgba(24,28,38,0.72)', 'surface-2': 'rgba(255,255,255,0.08)', ink: '#EDEFF3', 'ink-soft': '#B7BECB', accent: '#FF3B30', 'accent-ink': '#1A0402', 'accent-strong': '#FF6259', 'accent-on-surface': '#FF6259', good: '#2ED573', 'good-bg': 'rgba(46,213,115,0.2)', warn: '#FFA057', 'warn-bg': 'rgba(255,160,87,0.22)', line: 'rgba(255,255,255,0.16)', shadow: 'rgba(0,0,0,0.5)', 'sky-top': '#0B1330', 'sky-bottom': '#1B2550', 'terrain-top': '#1F3A2A', 'terrain-bottom': '#122318', celestial: '#E8E8E8', 'celestial-glow': 'rgba(232,232,232,.35)' },
    },
  };

  [
    { x: '8%', y: '12%', w: '64px', h: '20px' },
    { x: '22%', y: '22%', w: '44px', h: '14px' },
    { x: '62%', y: '10%', w: '56px', h: '18px' },
    { x: '78%', y: '26%', w: '38px', h: '12px' },
    { x: '40%', y: '6%', w: '48px', h: '15px' },
    { x: '88%', y: '40%', w: '30px', h: '10px' },
  ].forEach((d) => {
    const decoEl = document.createElement('div');
    decoEl.className = 'sky-deco';
    decoEl.style.setProperty('--x', d.x);
    decoEl.style.setProperty('--y', d.y);
    decoEl.style.setProperty('--w', d.w);
    decoEl.style.setProperty('--h', d.h);
    gameBg.appendChild(decoEl);
  });

  let themeMode = null;
  try { themeMode = localStorage.getItem('sbc-theme'); } catch (e) {}
  if (!['light', 'dark'].includes(themeMode)) themeMode = null;

  let currentVariant = 'a';
  try { currentVariant = localStorage.getItem('sbc-variant') || 'a'; } catch (e) {}
  if (!PALETTES[currentVariant]) currentVariant = 'a';

  const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function resolvedMode() {
    if (themeMode === 'light' || themeMode === 'dark') return themeMode;
    return systemDarkQuery.matches ? 'dark' : 'light';
  }
  function applyPalette() {
    const palette = PALETTES[currentVariant][resolvedMode()];
    Object.keys(palette).forEach((key) => {
      document.documentElement.style.setProperty('--' + key, palette[key]);
    });
  }
  function applyVariantAttr() {
    document.documentElement.setAttribute('data-variant', currentVariant);
    gameBg.style.display = currentVariant === 'e' ? 'block' : 'none';
    document.querySelectorAll('.variant-option').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset.pick === currentVariant);
    });
  }

  const themeLabels = { null: '🌓', light: '☀️', dark: '🌙' };
  const themeNextLabel = { null: 'Switch to light mode', light: 'Switch to dark mode', dark: 'Switch to system theme' };
  function updateThemeButton() {
    themeToggle.textContent = themeLabels[themeMode];
    themeToggle.setAttribute('aria-label', themeNextLabel[themeMode]);
  }
  themeToggle.addEventListener('click', () => {
    const order = [null, 'light', 'dark'];
    themeMode = order[(order.indexOf(themeMode) + 1) % order.length];
    try {
      if (themeMode) localStorage.setItem('sbc-theme', themeMode);
      else localStorage.removeItem('sbc-theme');
    } catch (e) {}
    updateThemeButton();
    applyPalette();
  });
  systemDarkQuery.addEventListener('change', () => { if (themeMode === null) applyPalette(); });

  variantToggle.addEventListener('click', () => variantOverlay.classList.add('open'));
  el('closeVariantModal').addEventListener('click', () => variantOverlay.classList.remove('open'));
  variantOverlay.addEventListener('click', (e) => { if (e.target === variantOverlay) variantOverlay.classList.remove('open'); });
  document.querySelectorAll('.variant-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      currentVariant = opt.dataset.pick;
      try { localStorage.setItem('sbc-variant', currentVariant); } catch (e) {}
      applyVariantAttr();
      applyPalette();
      variantOverlay.classList.remove('open');
    });
  });

  updateThemeButton();
  applyVariantAttr();
  applyPalette();

  /* ============================================================
     PWA install prompt
  ============================================================ */
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

  /* ============================================================
     Swipe navigation — left/right on the Learn or Test card moves
     between words, same as the ‹ › arrows. Pointer Events cover touch
     and mouse alike; only a mostly-horizontal drag past the threshold
     counts, so normal taps on buttons inside the card are unaffected.
  ============================================================ */
  function enableSwipeNav(container, onSwipeLeft, onSwipeRight) {
    if (!container) return;
    const THRESHOLD = 48;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    container.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      tracking = true;
    });
    container.addEventListener('pointerup', (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onSwipeLeft(); else onSwipeRight();
      }
    });
    container.addEventListener('pointercancel', () => { tracking = false; });
  }
  enableSwipeNav(learnPanel.querySelector('.immersive-stage'), () => stepLearn(1), () => stepLearn(-1));
  enableSwipeNav(testPanel.querySelector('.immersive-stage'), () => goToTest(1), () => goToTest(-1));

  /* ============================================================
     Initial render
  ============================================================ */
  renderDashboard();
})();

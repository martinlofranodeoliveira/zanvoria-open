(() => {
  const SAVE_KEY = 'aether-rift:wildbound:save';
  const SETTINGS_KEY = 'aether-rift:wildbound:settings';
  const sdk = () => window.CrazyGames?.SDK;
  let initialized = false;
  let usingCrazyGames = false;
  let muteHandler = null;

  function timeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`SDK init timed out after ${ms}ms`)), ms);
    });
  }

  async function init() {
    if (initialized) return usingCrazyGames;
    initialized = true;
    try {
      if (sdk()?.init) {
        await Promise.race([sdk().init(), timeout(1400)]);
        usingCrazyGames = true;
      }
    } catch (error) {
      console.warn('[platform] CrazyGames SDK unavailable, using local fallback.', error);
    }
    return usingCrazyGames;
  }

  async function loadingStart() {
    await init();
    try {
      sdk()?.game?.loadingStart?.();
    } catch {
      // Local fallback intentionally does nothing.
    }
  }

  async function loadingStop() {
    await init();
    try {
      sdk()?.game?.loadingStop?.();
    } catch {
      // Local fallback intentionally does nothing.
    }
  }

  async function gameplayStart() {
    await init();
    try {
      sdk()?.game?.gameplayStart?.();
    } catch {
      // Local fallback intentionally does nothing.
    }
  }

  async function gameplayStop() {
    await init();
    try {
      sdk()?.game?.gameplayStop?.();
    } catch {
      // Local fallback intentionally does nothing.
    }
  }

  async function getSave() {
    await init();
    try {
      if (usingCrazyGames && sdk()?.data?.getItem) {
        const value = await sdk().data.getItem(SAVE_KEY);
        if (value) return JSON.parse(value);
      }
    } catch (error) {
      console.warn('[platform] save read failed', error);
    }
    try {
      const value = localStorage.getItem(SAVE_KEY);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async function setSave(save) {
    const value = JSON.stringify(save);
    try {
      localStorage.setItem(SAVE_KEY, value);
    } catch {
      // Ignore quota errors in embedded contexts.
    }
    await init();
    try {
      if (usingCrazyGames && sdk()?.data?.setItem) {
        await sdk().data.setItem(SAVE_KEY, value);
      }
    } catch (error) {
      console.warn('[platform] save write failed', error);
    }
  }

  function getSettings() {
    try {
      const value = localStorage.getItem(SETTINGS_KEY);
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  }

  function setSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore quota errors in embedded contexts.
    }
  }

  async function requestAd(reason = 'midgame') {
    await init();
    if (!window.__AETHER_ENABLE_ADS__) return false;
    try {
      if (!sdk()?.ad?.requestAd) return false;
      await sdk().ad.requestAd(reason);
      return true;
    } catch (error) {
      console.warn('[platform] ad request skipped', error);
      return false;
    }
  }

  async function onMuteChange(handler) {
    muteHandler = handler;
    await init();
    try {
      if (sdk()?.game?.onMute) {
        sdk().game.onMute((muted) => muteHandler?.(!!muted));
      }
    } catch {
      // Local fallback intentionally does nothing.
    }
  }

  async function encryptScore(score, encryptionKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const rawKey = Uint8Array.from(atob(encryptionKey), (char) => char.charCodeAt(0));
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    const encodedScore = new TextEncoder().encode(String(score));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedScore
    );
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const payload = new Uint8Array(iv.length + encryptedBytes.length);
    payload.set(iv);
    payload.set(encryptedBytes, iv.length);
    return btoa(String.fromCharCode(...payload));
  }

  async function submitScore(score) {
    await init();
    const roundedScore = Math.max(0, Math.round(Number(score) || 0));
    try {
      localStorage.setItem('aether-rift:wildbound:last-score', String(roundedScore));
    } catch {
      // Ignore local fallback errors.
    }
    const encryptionKey = window.__AETHER_LEADERBOARD_KEY__;
    if (!usingCrazyGames || !sdk()?.user?.submitScore || !encryptionKey) {
      return { submitted: false, reason: 'leaderboard-not-configured', score: roundedScore };
    }
    const encryptedScore = await encryptScore(roundedScore, encryptionKey);
    await sdk().user.submitScore({
      encryptedScore,
      score: roundedScore
    });
    return { submitted: true, score: roundedScore };
  }

  window.CrazyBridge = {
    init,
    loadingStart,
    loadingStop,
    gameplayStart,
    gameplayStop,
    getSave,
    setSave,
    getSettings,
    setSettings,
    requestAd,
    onMuteChange,
    submitScore,
    isCrazyGames: () => usingCrazyGames
  };
})();

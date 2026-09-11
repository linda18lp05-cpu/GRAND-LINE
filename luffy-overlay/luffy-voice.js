export function createLuffyVoice() {
  let current = null;
  let unlocked = false;

  function stop() {
    if (current) {
      try {
        current.pause();
        current.removeAttribute("src");
        current.load();
      } catch (_) {}
      current = null;
    }
  }

  function playB64(b64) {
    stop();
    return new Promise((resolve) => {
      const audio = new Audio("data:audio/mpeg;base64," + b64);
      audio.playbackRate = 1.08;
      audio.preservesPitch = true;
      audio.mozPreservesPitch = true;
      audio.webkitPreservesPitch = true;
      audio.volume = 1;
      current = audio;
      const done = () => {
        if (current === audio) current = null;
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      const play = audio.play();
      if (play && play.catch) play.catch(done);
    });
  }

  return {
    unlock() {
      if (unlocked) return;
      unlocked = true;
      const silent = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=");
      silent.volume = 0.01;
      silent.play().catch(() => {});
    },
    stop,
    async speak(text) {
      const api = window.luffyDesk;
      if (!api?.speakLuffy) return;
      const b64 = await api.speakLuffy(text);
      if (!b64) return;
      return playB64(b64);
    },
  };
}

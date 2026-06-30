import { useState, useEffect, useRef } from 'react';
import { getBackendUrl } from '../../../api/agentmesh';

export default function useAudioPlayer() {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  const stopAudio = () => {
    if (audioRef.current) {
      console.log("[AudioEngine] Manually stopping playback");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioPlaying(false);
    }
  };

  const playAudio = (filename) => {
    if (!filename) return;
    let url;
    if (filename.startsWith('/temp/') || filename.startsWith('temp/')) {
      const cleanPath = filename.startsWith('/') ? filename : `/${filename}`;
      url = `${getBackendUrl()}${cleanPath}`;
    } else {
      url = `${getBackendUrl()}/audio/${filename.replace(/\\/g, '/')}`;
    }
    console.log("[AudioEngine] Attempting playback from:", url);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener('play', () => setAudioPlaying(true));
    audio.addEventListener('ended', () => setAudioPlaying(false));
    audio.addEventListener('pause', () => setAudioPlaying(false));

    audio.play()
      .then(() => console.log("[AudioEngine] Playback started"))
      .catch(e => {
        console.error("[AudioEngine] Playback failed:", e.message);
        setAudioPlaying(false);
      });
  };

  useEffect(() => {
    return () => {
      console.log("[AudioEngine] Component unmounting, stopping audio");
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return {
    audioPlaying,
    playAudio,
    stopAudio,
    audioRef
  };
}

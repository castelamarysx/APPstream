import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';
import '@videojs/http-streaming';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  autoplay = true,
  controls = true,
  className = ''
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Log da URL do stream para debug
    console.log('Tentando reproduzir stream:', src);

    // Determina o tipo de mídia baseado na extensão
    const getSourceType = (url: string) => {
      if (url.includes('.m3u8')) return 'application/x-mpegURL';
      if (url.includes('.ts')) return 'video/MP2T';
      if (url.includes('.mp4')) return 'video/mp4';
      return 'application/x-mpegURL';
    };

    // Prepara a URL do stream através do nosso proxy
    const getProxyUrl = (originalUrl: string) => {
      const apiUrl = process.env.NODE_ENV === 'production'
        ? window.location.origin
        : 'http://localhost:3001';
      return `${apiUrl}/api/stream?url=${encodeURIComponent(originalUrl)}`;
    };

    // Inicializa o player
    const player = videojs(videoRef.current, {
      controls,
      autoplay,
      preload: 'auto',
      fluid: true,
      responsive: true,
      fill: true,
      poster,
      liveui: !src.includes('.mp4'),
      html5: {
        vhs: {
          overrideNative: !src.includes('.mp4'),
          withCredentials: false,
          handleManifestRedirects: true,
          handlePartialData: true,
          headers: {
            'Range': 'bytes=0-'
          }
        },
        nativeAudioTracks: src.includes('.mp4'),
        nativeVideoTracks: src.includes('.mp4'),
        nativeTextTracks: src.includes('.mp4')
      },
      sources: [{
        src: getProxyUrl(src),
        type: getSourceType(src)
      }],
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'liveDisplay',
          'customControlSpacer',
          src.includes('.mp4') ? 'playbackRateMenuButton' : null,
          'fullscreenToggle'
        ].filter(Boolean)
      }
    });

    // Salva a referência do player
    playerRef.current = player;

    // Eventos do player
    player.on('error', (error) => {
      const errorDetails = player.error();
      console.error('Player error details:', {
        error,
        errorCode: errorDetails?.code,
        errorMessage: errorDetails?.message,
        errorType: errorDetails instanceof MediaError ? 'MediaError' : 'Unknown',
        currentSource: player.currentSource(),
        currentTime: player.currentTime(),
        networkState: player.networkState(),
        readyState: player.readyState()
      });

      // Tenta recarregar com a URL do proxy
      setTimeout(() => {
        const proxyUrl = getProxyUrl(src);
        player.src({
          src: proxyUrl,
          type: getSourceType(src)
        });
        player.load();
        player.play().catch(playError => {
          console.error('Erro ao tentar reproduzir através do proxy:', playError);
        });
      }, 2000);
    });

    // Log de eventos importantes
    const logEvent = (event: string) => console.log(`Player event: ${event}`);
    
    player.on('loadstart', () => logEvent('loadstart'));
    player.on('loadedmetadata', () => logEvent('loadedmetadata'));
    player.on('loadeddata', () => logEvent('loadeddata'));
    player.on('canplay', () => logEvent('canplay'));
    player.on('playing', () => logEvent('playing'));
    player.on('waiting', () => logEvent('waiting'));
    player.on('error', () => logEvent('error'));

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, autoplay, controls, poster]);

  return (
    <div data-vjs-player className={className}>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-theme-streamwaves"
        crossOrigin="anonymous"
      >
        <p className="vjs-no-js">
          Para ver este vídeo, ative o JavaScript e considere atualizar para um
          navegador que suporte vídeo HTML5
        </p>
      </video>
    </div>
  );
} 
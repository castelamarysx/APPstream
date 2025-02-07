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

    // Inicializa o player
    const player = videojs(videoRef.current, {
      controls,
      autoplay,
      preload: 'auto',
      fluid: true,
      responsive: true,
      fill: true,
      poster,
      liveui: !src.includes('.mp4'), // Desativa liveui para vídeos não-live
      html5: {
        vhs: {
          overrideNative: !src.includes('.mp4'), // Mantém nativo para MP4
          withCredentials: false,
          handleManifestRedirects: true,
          handlePartialData: true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        },
        nativeAudioTracks: src.includes('.mp4'),
        nativeVideoTracks: src.includes('.mp4'),
        nativeTextTracks: src.includes('.mp4')
      },
      sources: [{
        src,
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

      // Para MP4, tenta recarregar diretamente
      if (src.includes('.mp4')) {
        setTimeout(() => {
          player.src({
            src,
            type: 'video/mp4'
          });
          player.load();
          player.play().catch(playError => {
            console.error('Erro ao tentar reproduzir MP4:', playError);
          });
        }, 2000);
      } else {
        // Para outros formatos, tenta alternar entre HLS e TS
        const currentSource = player.currentSource() as { type?: string };
        const currentType = currentSource?.type || getSourceType(src);
        const alternativeType = currentType === 'application/x-mpegURL' ? 'video/MP2T' : 'application/x-mpegURL';
        
        console.log(`Tentando recarregar com tipo alternativo: ${alternativeType}`);
        
        setTimeout(() => {
          player.src({
            src,
            type: alternativeType
          });
          player.load();
          player.play().catch(playError => {
            console.error('Erro ao tentar reproduzir após recarregar:', playError);
          });
        }, 2000);
      }
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
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VideoPlayer } from '@/components/VideoPlayer';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Obtém os parâmetros da URL
  const streamUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'Stream';

  useEffect(() => {
    // Configura a página para modo teatro
    document.body.style.backgroundColor = '#000';
    document.title = title;

    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [title]);

  if (!streamUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p className="text-lg">URL do stream não fornecida</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-screen-2xl mx-auto px-4">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <div className="absolute inset-0">
              <VideoPlayer
                src={streamUrl}
                autoplay={true}
                controls={true}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h1 className="text-white text-xl font-semibold">{title}</h1>
      </div>
    </div>
  );
} 
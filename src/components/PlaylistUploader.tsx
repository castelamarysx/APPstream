import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link, FileText } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlaylistUploaderProps {
  onPlaylistLoad: (content: string, nickname: string) => void;
}

export const PlaylistUploader = ({ onPlaylistLoad }: PlaylistUploaderProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [url, setUrl] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!nickname.trim()) {
      setError('Por favor, insira um apelido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      if (!content.includes('#EXTM3U')) {
        throw new Error('Arquivo inválido. Por favor, envie uma playlist M3U válida.');
      }
      onPlaylistLoad(content, nickname);
      
      toast({
        title: "Success",
        description: "Playlist loaded successfully",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError('Por favor, insira um apelido');
      return;
    }

    if (!url.trim()) {
      setError('Por favor, insira uma URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      const content = await response.text();
      
      if (!content.includes('#EXTM3U')) {
        throw new Error('URL inválida. Por favor, insira uma URL de playlist M3U válida.');
      }

      onPlaylistLoad(content, nickname);
    } catch (err) {
      setError('Erro ao carregar a playlist. Verifique a URL e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Bem-vindo ao Stream Waves</h1>
        <p className="text-muted-foreground">
          Carregue sua playlist M3U ou insira a URL para começar
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nickname">Seu apelido</Label>
          <Input
            id="nickname"
            placeholder="Digite seu apelido..."
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError(null);
            }}
          />
        </div>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Arquivo</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="playlist">Arquivo M3U</Label>
              <div className="flex gap-2">
                <Input
                  id="playlist"
                  type="file"
                  accept=".m3u,.m3u8"
                  className="cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="url">URL da Playlist</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                    }}
                    disabled={loading}
                  />
                  <Button type="submit" disabled={loading}>
                    <Link className="h-4 w-4 mr-2" />
                    Carregar
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Suporta playlists M3U/M3U8</p>
        </div>
      </div>
    </div>
  );
};

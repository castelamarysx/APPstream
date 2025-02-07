import { toast } from '@/hooks/use-toast';
import { ConfigService } from './config-service';

interface IPTVResponse {
  data: any;
  error?: string;
}

interface IPTVRequestParams {
  url: string;
  username?: string;
  password?: string;
  action?: string;
  stream_id?: string;
  limit?: number;
  dns?: string;
}

// Atualiza para usar o mesmo proxy que funciona
const PROXY_BASE_URL = 'https://fast-iptv.vercel.app/xtream';

export class IPTVService {
  static async fetchWithProxy(params: IPTVRequestParams): Promise<IPTVResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Adiciona os parâmetros necessários
      if (params.url) queryParams.append('url', params.url.replace(/\/$/, ''));
      if (params.username) queryParams.append('username', params.username);
      if (params.password) queryParams.append('password', params.password);
      if (params.action) queryParams.append('action', params.action);
      if (params.stream_id) queryParams.append('stream_id', params.stream_id);
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${PROXY_BASE_URL}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching IPTV data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Erro",
        description: `Erro ao acessar servidor IPTV: ${errorMessage}`,
        variant: "destructive"
      });

      return { data: null, error: errorMessage };
    }
  }

  static async getStreamUrl(url: string): Promise<string> {
    try {
      // Extrai as credenciais e ID do stream da URL
      const match = url.match(/\/\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(\d+)/);
      if (!match) {
        return url;
      }

      const [, host, username, password, streamId] = match;
      
      // Retorna diretamente a URL do stream em formato m3u8
      return `http://${host}/live/${username}/${password}/${streamId}.m3u8`;
    } catch (error) {
      console.error('Error getting stream URL:', error);
      return url;
    }
  }

  static async getEPG(url: string, username: string, password: string, streamId: string, limit: number = 10): Promise<IPTVResponse> {
    return this.fetchWithProxy({
      url,
      username,
      password,
      action: 'get_short_epg',
      stream_id: streamId,
      limit
    });
  }

  static async getChannelsList(url: string, username: string, password: string): Promise<IPTVResponse> {
    return this.fetchWithProxy({
      url,
      username,
      password,
      action: 'get_live_streams'
    });
  }
} 
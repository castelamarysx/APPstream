
export interface MediaItem {
  id: string;
  title: string;
  logo?: string;
  url: string;
  type: 'movie' | 'series' | 'channel';
  category: string;
  season?: number;
  episode?: number;
  groupTitle?: string;
}

export interface ParsedPlaylist {
  movies: MediaItem[];
  series: MediaItem[];
  channels: MediaItem[];
  categories: {
    movies: string[];
    series: string[];
    channels: string[];
  };
}

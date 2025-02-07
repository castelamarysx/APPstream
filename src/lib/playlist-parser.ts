
import { MediaItem, ParsedPlaylist } from './types';

export function parseM3UContent(content: string): ParsedPlaylist {
  const lines = content.split('\n');
  const items: MediaItem[] = [];
  let currentItem: Partial<MediaItem> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      const matches = {
        title: line.match(/tvg-name="([^"]*)"/) || [],
        logo: line.match(/tvg-logo="([^"]*)"/) || [],
        group: line.match(/group-title="([^"]*)"/) || [],
      };

      currentItem = {
        id: crypto.randomUUID(),
        title: matches.title[1] || '',
        logo: matches.logo[1] || '',
        groupTitle: matches.group[1] || '',
      };

      // Determine type based on group-title
      if (currentItem.groupTitle?.toLowerCase().includes('filmes')) {
        currentItem.type = 'movie';
      } else if (currentItem.groupTitle?.toLowerCase().includes('séries')) {
        currentItem.type = 'series';
        // Parse season and episode for series
        const episodeInfo = currentItem.title?.match(/S(\d+)E(\d+)/i);
        if (episodeInfo) {
          currentItem.season = parseInt(episodeInfo[1]);
          currentItem.episode = parseInt(episodeInfo[2]);
        }
      } else {
        currentItem.type = 'channel';
      }
    } else if (line.startsWith('http')) {
      currentItem.url = line;
      if (Object.keys(currentItem).length > 0) {
        items.push({
          ...currentItem,
          category: currentItem.groupTitle || 'Uncategorized'
        } as MediaItem);
      }
      currentItem = {};
    }
  }

  const result: ParsedPlaylist = {
    movies: items.filter(item => item.type === 'movie'),
    series: items.filter(item => item.type === 'series'),
    channels: items.filter(item => item.type === 'channel'),
    categories: {
      movies: [...new Set(items.filter(item => item.type === 'movie').map(item => item.groupTitle || 'Uncategorized'))],
      series: [...new Set(items.filter(item => item.type === 'series').map(item => item.groupTitle || 'Uncategorized'))],
      channels: [...new Set(items.filter(item => item.type === 'channel').map(item => item.groupTitle || 'Uncategorized'))]
    }
  };

  return result;
}

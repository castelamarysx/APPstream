import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { ParsedPlaylist } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { openPlayerInNewWindow } from "@/lib/utils";
import { IPTVService } from "@/lib/iptv-service";

const ITEMS_PER_PAGE = 28;

interface PlaylistContentProps {
  playlist: ParsedPlaylist;
  searchQuery: string;
  selectedType: 'movies' | 'series' | 'channels';
  selectedCategory: string | null;
}

interface SeriesStructure {
  title: string;
  groupTitle: string;
  seasons: {
    [key: string]: {
      episodes: {
        id: string;
        title: string;
        logo: string;
        episode: string;
        url: string;
      }[];
    };
  };
  logo?: string;
}

export const PlaylistContent = ({
  playlist,
  searchQuery,
  selectedType,
  selectedCategory
}: PlaylistContentProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');

  const organizeSeriesContent = (content: any[]) => {
    const series: { [key: string]: SeriesStructure } = {};

    content.forEach(item => {
      // Skip 24H channels
      if (item.title.includes('[24H]')) return;

      // Extract series name (everything before S01, S02, etc)
      const seriesMatch = item.title.match(/(.*?)(?:\s+S\d{2}|$)/i);
      const seriesName = seriesMatch ? seriesMatch[1].trim() : item.title;
      
      // Extract season number
      const seasonMatch = item.title.match(/S(\d{2})/i);
      const season = seasonMatch ? seasonMatch[1] : '01';
      
      // Extract episode number
      const episodeMatch = item.title.match(/E(\d{2,3})/i);
      const episode = episodeMatch ? episodeMatch[1] : '01';

      if (!series[seriesName]) {
        series[seriesName] = {
          title: seriesName,
          groupTitle: item.groupTitle || '',
          seasons: {},
          logo: item.logo
        };
      }

      if (!series[seriesName].seasons[season]) {
        series[seriesName].seasons[season] = {
          episodes: []
        };
      }

      series[seriesName].seasons[season].episodes.push({
        id: item.id,
        title: item.title,
        logo: item.logo,
        episode,
        url: item.url
      });
    });

    return series;
  };

  const renderCategorySearch = () => {
    if (selectedType === 'series' && (selectedSeries || selectedSeason)) {
      return null;
    }

    return (
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={categorySearch}
            onChange={(e) => {
              setCategorySearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={selectedCategory 
              ? `Buscar em ${selectedCategory}...`
              : `Buscar em ${selectedType === 'movies' ? 'Filmes' : selectedType === 'series' ? 'Séries' : 'Canais'}...`
            }
            className="pl-9 pr-9"
          />
          {categorySearch && (
            <button
              onClick={() => setCategorySearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const filterContent = (content: any[]) => {
    let filtered = content;

    // Aplica o filtro de busca da categoria/geral primeiro
    if (categorySearch) {
      const searchTerm = categorySearch.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm) ||
        (item.groupTitle && item.groupTitle.toLowerCase().includes(searchTerm))
      );
    }

    // Depois aplica o filtro de categoria se houver uma selecionada
    if (selectedCategory) {
      filtered = filtered.filter(item => item.groupTitle === selectedCategory);
    }

    // Depois aplica o filtro de busca global
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.groupTitle && item.groupTitle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Move 24H content to channels
    if (selectedType === 'series') {
      filtered = filtered.filter(item => !item.title.includes('[24H]'));
    } else if (selectedType === 'channels') {
      const channelsToAdd = playlist.series.filter(item => {
        const matches24H = item.title.includes('[24H]');
        const matchesCategory = !selectedCategory || item.groupTitle === selectedCategory;
        const matchesSearch = !categorySearch || 
          item.title.toLowerCase().includes(categorySearch.toLowerCase()) ||
          (item.groupTitle && item.groupTitle.toLowerCase().includes(categorySearch.toLowerCase()));
        
        return matches24H && matchesCategory && matchesSearch;
      });
      filtered = [...filtered, ...channelsToAdd];
    }

    return filtered;
  };

  const getPaginatedContent = (items: any[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
      items: items.slice(startIndex, endIndex),
      totalPages: Math.ceil(items.length / ITEMS_PER_PAGE),
      totalItems: items.length
    };
  };

  const content = selectedType === 'movies' ? playlist.movies 
    : selectedType === 'series' ? playlist.series 
    : playlist.channels;

  const filteredContent = filterContent(content);
  const { items: paginatedContent, totalPages, totalItems } = getPaginatedContent(filteredContent);
  const seriesContent = selectedType === 'series' ? organizeSeriesContent(filteredContent) : null;

  const renderSeriesList = () => {
    const seriesList = Object.entries(seriesContent || {});
    const { items: paginatedSeries, totalPages: seriesTotalPages, totalItems: seriesTotalItems } = getPaginatedContent(seriesList);

    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
          {paginatedSeries.map(([title, series]) => (
            <div 
              key={title} 
              className="group cursor-pointer"
              onClick={() => setSelectedSeries(title)}
            >
              <div className="relative w-full pb-[150%] bg-muted rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                <img
                  src={series.logo || `https://via.placeholder.com/400x600/1F2937/FFFFFF?text=${encodeURIComponent(title)}`}
                  alt={title}
                  className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="mt-3">
                <h3 className="text-base font-medium truncate">{title}</h3>
                <p className="text-sm text-muted-foreground truncate mt-1.5">
                  {series.groupTitle}
                </p>
              </div>
            </div>
          ))}
        </div>
        {paginatedSeries.length > 0 ? (
          <>
            {renderPagination()}
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Página {currentPage} de {seriesTotalPages} • Total: {seriesTotalItems} séries
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Nenhuma série encontrada</p>
          </div>
        )}
      </>
    );
  };

  const renderSeasonsList = () => {
    if (!selectedSeries || !seriesContent) return null;
    const series = seriesContent[selectedSeries];
    const seasons = Object.keys(series.seasons).sort();

    return (
      <>
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            className="p-2 hover:bg-accent"
            onClick={() => {
              setSelectedSeries(null);
              setSelectedSeason(null);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold">{selectedSeries}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
          {seasons.map((season) => (
            <div 
              key={season} 
              className="group cursor-pointer"
              onClick={() => setSelectedSeason(season)}
            >
              <div className="relative w-full pb-[150%] bg-muted rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                <img
                  src={series.logo || `https://via.placeholder.com/400x600/1F2937/FFFFFF?text=Temporada ${season}`}
                  alt={`Temporada ${season}`}
                  className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">T{season}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderEpisodesList = () => {
    if (!selectedSeries || !selectedSeason || !seriesContent) return null;
    const series = seriesContent[selectedSeries];
    const episodes = series.seasons[selectedSeason].episodes.sort((a, b) => 
      parseInt(a.episode) - parseInt(b.episode)
    );

    return (
      <>
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            className="p-2 hover:bg-accent"
            onClick={() => setSelectedSeason(null)}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedSeries}</h2>
            <p className="text-muted-foreground">Temporada {selectedSeason}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
          {episodes.map((episode) => (
            <div 
              key={episode.id} 
              className="group cursor-pointer"
              onClick={() => handlePlay(
                episode.url,
                `${selectedSeries} - T${selectedSeason}E${episode.episode}`
              )}
            >
              <div className="relative w-full pb-[150%] bg-muted rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                <img
                  src={episode.logo || `https://via.placeholder.com/400x600/1F2937/FFFFFF?text=E${episode.episode}`}
                  alt={episode.title}
                  className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                  <div className="absolute bottom-0 p-4">
                    <span className="text-lg font-semibold text-white">Episódio {parseInt(episode.episode)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const delta = 2;
      const pages = [];
      let leftBound = Math.max(1, currentPage - delta);
      let rightBound = Math.min(totalPages, currentPage + delta);

      if (currentPage - delta > 1) {
        pages.push(1);
        if (currentPage - delta > 2) {
          pages.push('...');
        }
      }

      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }

      if (currentPage + delta < totalPages) {
        if (currentPage + delta < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }

      return pages;
    };

    return (
      <div className="mt-8 flex justify-center items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          title="Primeira página"
        >
          <ChevronLeft className="h-4 w-4 mr-[-4px]" />
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2">...</span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage(page as number)}
                className="min-w-[32px]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          title="Próxima página"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          title="Última página"
        >
          <ChevronLeft className="h-4 w-4 rotate-180 ml-[-4px]" />
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </Button>
      </div>
    );
  };

  const handlePlay = async (url: string, title: string) => {
    try {
      // Obtém a URL do stream com o token
      const streamUrl = await IPTVService.getStreamUrl(url);
      
      // Abre o player com a URL do stream
      openPlayerInNewWindow({
        url: streamUrl,
        title
      });
    } catch (error) {
      console.error('Error playing content:', error);
    }
  };

  const renderContent = () => {
    return (
      <>
        <div className="mb-6">
          {renderCategorySearch()}
          {!selectedCategory && (
            <div className="text-center mt-2 text-sm text-muted-foreground">
              Mostrando {Math.min(ITEMS_PER_PAGE, totalItems)} de {totalItems} itens
            </div>
          )}
        </div>
        {selectedType === 'series' ? (
          <>
            {selectedSeason ? renderEpisodesList() :
             selectedSeries ? renderSeasonsList() :
             renderSeriesList()}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
              {paginatedContent.map((item) => (
                <div 
                  key={item.id} 
                  className="group cursor-pointer"
                  onClick={() => handlePlay(item.url, item.title)}
                >
                  <div className="relative w-full pb-[150%] bg-muted rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    <img
                      src={item.logo || `https://via.placeholder.com/400x600/1F2937/FFFFFF?text=${encodeURIComponent(item.title)}`}
                      alt={item.title}
                      className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-base font-medium truncate">{item.title}</h3>
                    {item.groupTitle && (
                      <p className="text-sm text-muted-foreground truncate mt-1.5">
                        {item.groupTitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {paginatedContent.length > 0 ? (
              <>
                {renderPagination()}
                <div className="text-center mt-4 text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} • Total: {totalItems} itens
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Nenhum resultado encontrado</p>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedSeries(null);
    setSelectedSeason(null);
    setCategorySearch('');
  }, [selectedType, selectedCategory, searchQuery]);

  return (
    <div className="container mx-auto px-6 py-8">
      {renderContent()}
    </div>
  );
};

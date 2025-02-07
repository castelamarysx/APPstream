import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { ParsedPlaylist } from "@/lib/types";

interface NavigationProps {
  playlist: ParsedPlaylist;
  onSelectCategory: (type: 'movies' | 'series' | 'channels', category: string | null) => void;
  selectedType: 'movies' | 'series' | 'channels';
  selectedCategory: string | null;
}

export const Navigation = ({ playlist, onSelectCategory, selectedType, selectedCategory }: NavigationProps) => {
  const menuItems = [
    { type: 'movies', label: 'Filmes', count: playlist.movies.length, categories: playlist.categories.movies },
    { type: 'series', label: 'Séries', count: playlist.series.length, categories: playlist.categories.series },
    { type: 'channels', label: 'Canais', count: playlist.channels.length, categories: playlist.categories.channels }
  ] as const;

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto">
        <div className="flex h-14 items-center px-4">
          <nav className="flex items-center space-x-6">
            {menuItems.map(({ type, label, count, categories }) => (
              <div key={type} className="flex items-center">
                <Button
                  variant={selectedType === type ? "default" : "ghost"}
                  className="h-9 px-4 font-medium"
                  onClick={() => onSelectCategory(type, null)}
                >
                  {label}
                  <span className="ml-2 text-sm text-muted-foreground">({count})</span>
                </Button>

                {categories.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`ml-1 h-9 w-9 ${selectedType === type ? 'text-primary' : ''}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 max-h-[70vh] overflow-y-auto">
                      <DropdownMenuItem
                        className={`${selectedCategory === null && selectedType === type ? 'bg-accent' : ''}`}
                        onClick={() => onSelectCategory(type, null)}
                      >
                        <span className="font-medium">Todos</span>
                      </DropdownMenuItem>
                      {categories.map(category => (
                        <DropdownMenuItem
                          key={category}
                          className={`${selectedCategory === category ? 'bg-accent' : ''}`}
                          onClick={() => onSelectCategory(type, category)}
                        >
                          {category}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

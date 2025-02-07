import { useState, useEffect } from 'react';
import { PlaylistContent } from '@/components/PlaylistContent';
import { Navigation } from '@/components/Navigation';
import { SearchBar } from '@/components/SearchBar';
import { Header } from '@/components/Header';
import { parseM3UContent } from '@/lib/playlist-parser';
import type { UserData } from '@/types/user';
import { DatabaseService } from '@/lib/db';
import { toast } from '@/hooks/use-toast';
import { UserSelector } from '@/components/UserSelector';

const db = new DatabaseService();

const Index = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'movies' | 'series' | 'channels'>('movies');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializa o banco de dados e carrega os dados dos usuários
  useEffect(() => {
    const initDB = async () => {
      try {
        await db.init();
        const loadedUsers = await db.getAllUsers();
        setUsers(loadedUsers);
      } catch (error) {
        console.error('Error initializing database:', error);
        toast({
          title: "Erro",
          description: "Erro ao inicializar o banco de dados",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  const handlePlaylistLoad = async (content: string, nickname: string) => {
    try {
      const parsed = parseM3UContent(content);
      const newUserData: UserData = { nickname, playlist: parsed };
      
      await db.saveUserData(newUserData);
      setUsers(prevUsers => [...prevUsers, newUserData]);
      setUserData(newUserData);
      
      toast({
        title: "Sucesso",
        description: "Playlist carregada com sucesso",
      });
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a playlist",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (nickname: string) => {
    try {
      await db.deleteUserData(nickname);
      setUsers(prevUsers => prevUsers.filter(user => user.nickname !== nickname));
      if (userData?.nickname === nickname) {
        setUserData(null);
        setSearchQuery('');
        setSelectedType('movies');
        setSelectedCategory(null);
      }
      
      toast({
        title: "Sucesso",
        description: "Playlist excluída com sucesso",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir a playlist",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setUserData(null);
    setSearchQuery('');
    setSelectedType('movies');
    setSelectedCategory(null);
  };

  const handleCategorySelect = (type: 'movies' | 'series' | 'channels', category: string | null) => {
    setSelectedType(type);
    setSelectedCategory(category);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Carregando...</h2>
          <p className="text-muted-foreground">Inicializando o Stream Waves</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <UserSelector
        users={users}
        onSelectUser={setUserData}
        onDeleteUser={handleDeleteUser}
        onAddNewUser={handlePlaylistLoad}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userNickname={userData.nickname} onLogout={handleLogout} />
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <Navigation 
          playlist={userData.playlist} 
          onSelectCategory={handleCategorySelect}
          selectedType={selectedType}
          selectedCategory={selectedCategory}
        />
      </div>
      <main>
        <PlaylistContent 
          playlist={userData.playlist} 
          searchQuery={searchQuery}
          selectedType={selectedType}
          selectedCategory={selectedCategory}
        />
      </main>
    </div>
  );
};

export default Index;

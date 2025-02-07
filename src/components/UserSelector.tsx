import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaylistUploader } from "@/components/PlaylistUploader";
import { Plus, User, Trash2 } from "lucide-react";
import type { UserData } from "@/types/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserSelectorProps {
  users: UserData[];
  onSelectUser: (user: UserData) => void;
  onDeleteUser: (nickname: string) => void;
  onAddNewUser: (content: string, nickname: string) => void;
}

export const UserSelector = ({
  users,
  onSelectUser,
  onDeleteUser,
  onAddNewUser,
}: UserSelectorProps) => {
  const [showUploader, setShowUploader] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleDeleteClick = (nickname: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserToDelete(nickname);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  if (showUploader) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-10"
          onClick={() => setShowUploader(false)}
        >
          ← Voltar
        </Button>
        <PlaylistUploader onPlaylistLoad={onAddNewUser} />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Bem-vindo ao Stream Waves</h1>
        <p className="text-muted-foreground">
          Selecione uma playlist salva ou adicione uma nova
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card para adicionar nova playlist */}
        <Card
          className="group relative cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center p-6 min-h-[200px] border-dashed"
          onClick={() => setShowUploader(true)}
        >
          <div className="flex flex-col items-center gap-4 text-muted-foreground group-hover:text-foreground transition-colors">
            <Plus className="w-8 h-8" />
            <span className="font-medium">Adicionar Nova Playlist</span>
          </div>
        </Card>

        {/* Cards das playlists salvas */}
        {users.map((user) => (
          <Card
            key={user.nickname}
            className="group relative cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => onSelectUser(user)}
          >
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDeleteClick(user.nickname, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">{user.nickname}</h3>
                <p className="text-sm text-muted-foreground">
                  {user.playlist.movies.length} Filmes •{" "}
                  {user.playlist.series.length} Séries •{" "}
                  {user.playlist.channels.length} Canais
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta playlist? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ConfigService } from '@/lib/config-service';

export function DNSSettings() {
  const [dns, setDns] = useState('');

  useEffect(() => {
    // Carrega o DNS salvo quando o componente é montado
    setDns(ConfigService.getCustomDNS());
  }, []);

  const handleSave = () => {
    try {
      // Valida o formato do DNS (IP v4 simples)
      if (dns && !/^(\d{1,3}\.){3}\d{1,3}$/.test(dns)) {
        throw new Error('Formato de DNS inválido. Use o formato: 8.8.8.8');
      }

      ConfigService.setCustomDNS(dns);
      
      toast({
        title: "Sucesso",
        description: dns ? "DNS personalizado salvo com sucesso" : "DNS padrão do sistema será utilizado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar DNS",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dns">DNS Personalizado</Label>
        <div className="flex gap-2">
          <Input
            id="dns"
            placeholder="Ex: 8.8.8.8"
            value={dns}
            onChange={(e) => setDns(e.target.value)}
          />
          <Button onClick={handleSave}>Salvar</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Deixe em branco para usar o DNS padrão do sistema
        </p>
      </div>
    </div>
  );
} 
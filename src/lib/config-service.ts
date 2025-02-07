interface AppConfig {
  customDNS: string;
}

const DEFAULT_CONFIG: AppConfig = {
  customDNS: '', // DNS padrão quando vazio
};

export class ConfigService {
  private static readonly STORAGE_KEY = 'streamwaves_config';

  static getConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return DEFAULT_CONFIG;
  }

  static saveConfig(config: Partial<AppConfig>): void {
    try {
      const currentConfig = this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  static getCustomDNS(): string {
    return this.getConfig().customDNS;
  }

  static setCustomDNS(dns: string): void {
    this.saveConfig({ customDNS: dns });
  }
} 
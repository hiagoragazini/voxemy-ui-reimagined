
import { createClient } from '@supabase/supabase-js';
import { configValidator } from '../validation/config-validator';
import { whatsappManager } from '../whatsapp-manager';

interface ServiceStatus {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    supabase: ServiceStatus;
    evolutionApi: ServiceStatus;
    openai: ServiceStatus;
    whatsappManager: ServiceStatus & { activeConnections?: number };
  };
  config: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

class HealthChecker {
  private static instance: HealthChecker;
  private supabase;

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    // Validate configuration
    const configResult = configValidator.validateConfig();

    // Check all services
    const [supabaseStatus, evolutionApiStatus, openaiStatus, whatsappStatus] = await Promise.all([
      this.checkSupabase(),
      this.checkEvolutionApi(),
      this.checkOpenAI(),
      this.checkWhatsAppManager()
    ]);

    // Determine overall status
    const services = {
      supabase: supabaseStatus,
      evolutionApi: evolutionApiStatus,
      openai: openaiStatus,
      whatsappManager: whatsappStatus
    };

    const downServices = Object.values(services).filter(s => s.status === 'down').length;
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (downServices === 0) {
      overallStatus = 'healthy';
    } else if (downServices <= 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    // Configuration errors also affect health
    if (configResult.errors.length > 0) {
      overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      config: {
        isValid: configResult.isValid,
        errors: configResult.errors,
        warnings: configResult.warnings
      }
    };
  }

  private async checkSupabase(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await Promise.race([
        this.supabase.from('agents').select('count').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]) as any;

      if (error) {
        throw error;
      }

      return {
        status: 'up',
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkEvolutionApi(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    const evolutionApiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey) {
      return {
        status: 'down',
        error: 'Evolution API not configured'
      };
    }

    try {
      const response = await Promise.race([
        fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
          headers: { 'apikey': evolutionApiKey }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]) as Response;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        status: 'up',
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkOpenAI(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return {
        status: 'down',
        error: 'OpenAI API key not configured'
      };
    }

    try {
      const response = await Promise.race([
        fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${openaiApiKey}` }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]) as Response;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        status: 'up',
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkWhatsAppManager(): Promise<ServiceStatus & { activeConnections?: number }> {
    const startTime = Date.now();
    
    try {
      const healthStatus = await whatsappManager.healthCheck();
      const activeConnections = Object.values(healthStatus).filter(Boolean).length;

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        activeConnections
      };
    } catch (error: any) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  async checkConnectivity(): Promise<{ [service: string]: boolean }> {
    const results = await this.checkHealth();
    
    return {
      supabase: results.services.supabase.status === 'up',
      evolutionApi: results.services.evolutionApi.status === 'up',
      openai: results.services.openai.status === 'up',
      whatsappManager: results.services.whatsappManager.status === 'up'
    };
  }
}

export const healthChecker = HealthChecker.getInstance();
export type { HealthStatus, ServiceStatus };

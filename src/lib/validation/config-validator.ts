
interface EnvironmentConfig {
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  openaiApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  appUrl?: string;
  nodeEnv?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: EnvironmentConfig;
}

class ConfigValidator {
  private static instance: ConfigValidator;

  static getInstance(): ConfigValidator {
    if (!ConfigValidator.instance) {
      ConfigValidator.instance = new ConfigValidator();
    }
    return ConfigValidator.instance;
  }

  validateConfig(): ValidationResult {
    const config: EnvironmentConfig = {
      evolutionApiUrl: process.env.NEXT_PUBLIC_EVOLUTION_API_URL,
      evolutionApiKey: process.env.EVOLUTION_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV
    };

    const errors: string[] = [];
    const warnings: string[] = [];

    // Required for production
    if (config.nodeEnv === 'production') {
      if (!config.supabaseUrl) {
        errors.push('NEXT_PUBLIC_SUPABASE_URL is required in production');
      }
      if (!config.supabaseAnonKey) {
        errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production');
      }
      if (!config.appUrl) {
        errors.push('NEXT_PUBLIC_APP_URL is required in production');
      }
    }

    // WhatsApp specific validations
    if (!config.evolutionApiUrl) {
      warnings.push('NEXT_PUBLIC_EVOLUTION_API_URL not configured - WhatsApp features will run in development mode');
    } else if (!this.isValidUrl(config.evolutionApiUrl)) {
      errors.push('NEXT_PUBLIC_EVOLUTION_API_URL must be a valid URL');
    }

    if (!config.evolutionApiKey) {
      warnings.push('EVOLUTION_API_KEY not configured - WhatsApp features will run in development mode');
    }

    if (!config.openaiApiKey) {
      warnings.push('OPENAI_API_KEY not configured - AI features may not work');
    }

    // URL validations
    if (config.supabaseUrl && !this.isValidUrl(config.supabaseUrl)) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
    }

    if (config.appUrl && !this.isValidUrl(config.appUrl)) {
      errors.push('NEXT_PUBLIC_APP_URL must be a valid URL');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      config
    };
  }

  generateEnvTemplate(): string {
    return `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Evolution API Configuration (WhatsApp)
NEXT_PUBLIC_EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-evolution-api-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-app.com
NODE_ENV=production

# Optional
ELEVENLABS_API_KEY=your-elevenlabs-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
`;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getRequiredVariables(): string[] {
    return [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL'
    ];
  }

  getOptionalVariables(): string[] {
    return [
      'NEXT_PUBLIC_EVOLUTION_API_URL',
      'EVOLUTION_API_KEY',
      'OPENAI_API_KEY',
      'ELEVENLABS_API_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER'
    ];
  }
}

export const configValidator = ConfigValidator.getInstance();
export type { ValidationResult, EnvironmentConfig };

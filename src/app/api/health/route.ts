
import { healthChecker } from '@/lib/health/health-checker';

export async function GET(req: Request) {
  try {
    const healthStatus = await healthChecker.checkHealth();
    
    const statusCode = healthStatus.status === 'unhealthy' ? 503 : 200;
    
    return new Response(JSON.stringify(healthStatus), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        supabase: { status: 'down', error: 'Health check failed' },
        evolutionApi: { status: 'down', error: 'Health check failed' },
        openai: { status: 'down', error: 'Health check failed' },
        whatsappManager: { status: 'down', error: 'Health check failed' }
      },
      config: {
        isValid: false,
        errors: ['Health check system failure'],
        warnings: []
      }
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }
}

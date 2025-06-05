
import { Request, Response } from 'express';
import { healthChecker } from '@/lib/health/health-checker';

export async function GET(req: Request, res: Response) {
  try {
    const healthStatus = await healthChecker.checkHealth();
    
    const statusCode = healthStatus.status === 'unhealthy' ? 503 : 200;
    
    return res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(503).json({
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
    });
  }
}

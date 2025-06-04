
import { NextResponse } from 'next/server';
import { healthChecker } from '@/lib/health/health-checker';

export async function GET() {
  try {
    const healthStatus = await healthChecker.checkHealth();
    
    const statusCode = healthStatus.status === 'unhealthy' ? 503 : 200;
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
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
    }, { status: 503 });
  }
}

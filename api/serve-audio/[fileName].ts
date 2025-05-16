
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    // Obter o parâmetro fileName da URL
    const { pathname } = new URL(req.url);
    const fileName = pathname.split('/').pop();
    
    if (!fileName) {
      return new Response('Nome do arquivo não especificado', { status: 400 });
    }
    
    console.log(`[VERCEL-AUDIO-PROXY] Servindo arquivo: ${fileName}`);
    
    // Decodificar o filename (pode ter sido codificado)
    const decodedFileName = decodeURIComponent(fileName);
    
    // Extrair informações do nome do arquivo (assumindo formato específico)
    // Exemplo: call_12345_voiceId_hash.mp3
    const parts = decodedFileName.split('_');
    let filePath = '';
    
    // Se tem o formato esperado com callId
    if (parts[0] === 'call' && parts.length > 2) {
      const callId = `${parts[0]}_${parts[1]}_${parts[2]}`;
      filePath = `calls/${callId}/${decodedFileName}`;
    } else {
      // Fallback: procurar em qualquer subdiretório de calls
      filePath = `calls/${decodedFileName}`;
    }
    
    console.log(`[VERCEL-AUDIO-PROXY] Caminho completo: ${filePath}`);
    
    // Tentar várias localizações possíveis
    const possiblePaths = [
      filePath,
      `calls/${decodedFileName}`,
      decodedFileName,
    ];
    
    let fileData = null;
    let downloadPath = '';
    
    // Tentar cada caminho possível
    for (const path of possiblePaths) {
      console.log(`[VERCEL-AUDIO-PROXY] Tentando caminho: ${path}`);
      
      const { data, error } = await supabase
        .storage
        .from('tts_audio')
        .download(path);
      
      if (!error && data) {
        console.log(`[VERCEL-AUDIO-PROXY] Arquivo encontrado em: ${path}`);
        fileData = data;
        downloadPath = path;
        break;
      }
    }
    
    if (!fileData) {
      console.error(`[VERCEL-AUDIO-PROXY] Arquivo não encontrado em nenhum caminho tentado`);
      return new Response('Arquivo não encontrado', { status: 404 });
    }
    
    // Configurar cabeçalhos otimizados para o Twilio
    const headers = {
      'Content-Type': 'audio/mpeg',
      'Content-Length': fileData.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
      'Content-Disposition': `attachment; filename="${decodedFileName}"`,
      'X-Audio-Source': `supabase:tts_audio/${downloadPath}`,
      'Access-Control-Allow-Origin': '*',
    };
    
    console.log(`[VERCEL-AUDIO-PROXY] Servindo áudio com tamanho: ${fileData.size} bytes`);
    
    // Retornar o arquivo com os cabeçalhos corretos
    return new Response(fileData, { 
      status: 200,
      headers 
    });
  } catch (error: any) {
    console.error(`[VERCEL-AUDIO-PROXY] Erro: ${error.message}`);
    return new Response(`Erro ao servir áudio: ${error.message}`, { status: 500 });
  }
}

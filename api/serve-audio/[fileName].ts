
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
    
    console.log(`[VERCEL-AUDIO-PROXY] Requisição recebida: ${req.url}`);
    console.log(`[VERCEL-AUDIO-PROXY] User-Agent: ${req.headers.get('user-agent') || 'desconhecido'}`);
    console.log(`[VERCEL-AUDIO-PROXY] Origem: ${req.headers.get('origin') || 'desconhecida'}`);
    console.log(`[VERCEL-AUDIO-PROXY] Servindo arquivo: ${fileName}`);
    
    // Decodificar o filename (pode ter sido codificado)
    const decodedFileName = decodeURIComponent(fileName);
    
    // Extrair informações do nome do arquivo (assumindo formato específico)
    // Formato esperado: voiceId_hash_timestamp.mp3
    const parts = decodedFileName.split('_');
    let filePath = '';
    
    // Se tem o formato de voiceId_hash_timestamp
    if (parts.length >= 3) {
      const voiceId = parts[0];
      // Tentar encontrar na raiz ou em subdiretorios
      filePath = `calls/${decodedFileName}`;
    } else {
      // Fallback: procurar em qualquer subdiretório de calls
      filePath = `calls/${decodedFileName}`;
    }
    
    console.log(`[VERCEL-AUDIO-PROXY] Tentando caminho: ${filePath}`);
    
    // Tentar várias localizações possíveis
    const possiblePaths = [
      filePath,
      `calls/${decodedFileName}`,
      decodedFileName,
    ];
    
    let fileData = null;
    let downloadPath = '';
    let foundLocation = '';
    
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
        foundLocation = path;
        break;
      }
    }
    
    if (!fileData) {
      // Se não encontrou, tentar listar arquivos para depuração
      const { data: listData } = await supabase
        .storage
        .from('tts_audio')
        .list('calls', { 
          limit: 10, 
          sortBy: { column: 'created_at', order: 'desc' } 
        });
        
      console.error(`[VERCEL-AUDIO-PROXY] Arquivo não encontrado em nenhum caminho tentado`);
      console.error(`[VERCEL-AUDIO-PROXY] Arquivos recentes: ${JSON.stringify(listData || [])}`);
      
      return new Response('Arquivo não encontrado', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    console.log(`[VERCEL-AUDIO-PROXY] Tipo de arquivo: ${fileData.type}`);
    console.log(`[VERCEL-AUDIO-PROXY] Tamanho do arquivo: ${fileData.size} bytes`);
    
    // Configurar cabeçalhos otimizados para o Twilio
    const headers = {
      'Content-Type': 'audio/mpeg',
      'Content-Length': fileData.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
      'Content-Disposition': `attachment; filename="${decodedFileName}"`,
      'X-Audio-Source': `supabase:tts_audio/${downloadPath}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    
    console.log(`[VERCEL-AUDIO-PROXY] Servindo áudio com tamanho: ${fileData.size} bytes`);
    console.log(`[VERCEL-AUDIO-PROXY] Headers: ${JSON.stringify(headers)}`);
    
    // Retornar o arquivo com os cabeçalhos corretos
    return new Response(fileData, { 
      status: 200,
      headers 
    });
  } catch (error: any) {
    console.error(`[VERCEL-AUDIO-PROXY] Erro: ${error.message}`);
    console.error(`[VERCEL-AUDIO-PROXY] Stack: ${error.stack}`);
    return new Response(`Erro ao servir áudio: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

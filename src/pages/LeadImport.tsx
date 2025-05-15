
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Download, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";

interface ImportedLead {
  name: string;
  email: string;
  phone: string;
  company?: string;
  source?: string;
  [key: string]: any;
}

export default function LeadImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedLead[]>([]);
  const [fieldMapping, setFieldMapping] = useState<{ [key: string]: string }>({});
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'processing' | 'success'>('upload');
  const [errorRows, setErrorRows] = useState<number[]>([]);
  
  // Modelo para download
  const downloadTemplate = () => {
    const csvContent = "name,email,phone,company,source\nJoão Silva,joao@example.com,(11) 98765-4321,Empresa ABC,website\nMaria Souza,maria@example.com,(21) 99876-5432,Consultoria XYZ,event";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_leads.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler para seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error("Por favor, selecione um arquivo CSV válido");
        return;
      }
      
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };
  
  // Parser para arquivo CSV
  const parseFile = (file: File) => {
    setValidating(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = results.meta.fields || [];
          
          // Verifica se tem pelo menos os campos obrigatórios
          if (headers.length < 2) {
            toast.error("O arquivo não contém colunas suficientes");
            setValidating(false);
            return;
          }
          
          // Sugerir mapeamento automático para cabeçalhos comuns
          const suggestedMapping: { [key: string]: string } = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            
            if (lowerHeader.includes('nome') || lowerHeader.includes('name')) {
              suggestedMapping[header] = 'name';
            }
            else if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) {
              suggestedMapping[header] = 'email';
            }
            else if (lowerHeader.includes('telefone') || lowerHeader.includes('phone') || 
                    lowerHeader.includes('celular') || lowerHeader.includes('mobile')) {
              suggestedMapping[header] = 'phone';
            }
            else if (lowerHeader.includes('empresa') || lowerHeader.includes('company') || 
                    lowerHeader.includes('organização') || lowerHeader.includes('organization')) {
              suggestedMapping[header] = 'company';
            }
            else if (lowerHeader.includes('origem') || lowerHeader.includes('source') || 
                    lowerHeader.includes('fonte')) {
              suggestedMapping[header] = 'source';
            }
            else {
              suggestedMapping[header] = '';
            }
          });
          
          setFieldMapping(suggestedMapping);
          
          // Validar se tem pelo menos email ou telefone
          const hasContactInfo = headers.some(header => {
            const lowerHeader = header.toLowerCase();
            return lowerHeader.includes('email') || 
                  lowerHeader.includes('e-mail') || 
                  lowerHeader.includes('telefone') || 
                  lowerHeader.includes('phone') ||
                  lowerHeader.includes('celular') ||
                  lowerHeader.includes('mobile');
          });
          
          if (!hasContactInfo) {
            toast.warning("O arquivo não parece conter informações de contato (email ou telefone)");
          }
          
          // Preview com os primeiros registros
          const preview = results.data.slice(0, 5) as ImportedLead[];
          setPreviewData(preview);
          setImportStep('mapping');
        } else {
          toast.error("O arquivo não contém dados válidos");
        }
        setValidating(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        toast.error("Erro ao processar o arquivo. Verifique o formato CSV");
        setValidating(false);
      }
    });
  };
  
  // Atualizar mapeamento
  const updateMapping = (originalField: string, mappedField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [originalField]: mappedField
    }));
  };
  
  // Proceder para visualização dos dados
  const proceedToPreview = () => {
    // Verificar se os campos obrigatórios foram mapeados
    const hasMappedName = Object.values(fieldMapping).includes('name');
    const hasMappedEmail = Object.values(fieldMapping).includes('email');
    const hasMappedPhone = Object.values(fieldMapping).includes('phone');
    
    if (!hasMappedName) {
      toast.warning("Por favor, mapeie uma coluna para o campo 'Nome'");
      return;
    }
    
    if (!hasMappedEmail && !hasMappedPhone) {
      toast.warning("Por favor, mapeie colunas para 'Email' e/ou 'Telefone'");
      return;
    }
    
    setImportStep('preview');
  };
  
  // Validar dados
  const validateData = (data: ImportedLead[]) => {
    const errors: number[] = [];
    
    data.forEach((row, index) => {
      // Verificar se a row tem as propriedades necessárias após o mapeamento
      const mappedRow = mapRow(row);
      
      // Validar email se existir
      if (mappedRow.email && !isValidEmail(mappedRow.email)) {
        errors.push(index);
      }
      
      // Validar nome (obrigatório)
      if (!mappedRow.name || mappedRow.name.trim() === '') {
        errors.push(index);
      }
      
      // Validar telefone se existir
      if (mappedRow.phone && !isValidPhone(mappedRow.phone)) {
        // Não marcar como erro, apenas normalizar ao importar
      }
    });
    
    return errors;
  };
  
  // Validar email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Validar telefone (verificação simples)
  const isValidPhone = (phone: string) => {
    return /^[0-9()\s\-+]{8,20}$/.test(phone);
  };
  
  // Mapear linhas de acordo com o mapeamento
  const mapRow = (row: any): ImportedLead => {
    const mappedRow: ImportedLead = { name: '', email: '', phone: '' };
    
    Object.entries(fieldMapping).forEach(([originalField, mappedField]) => {
      if (mappedField && row[originalField] !== undefined) {
        mappedRow[mappedField] = row[originalField];
      }
    });
    
    return mappedRow;
  };
  
  // Iniciar importação
  const startImport = async () => {
    if (!file) return;
    
    setImportStep('processing');
    setImporting(true);
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const data = results.data as ImportedLead[];
          
          // Validar dados
          const errors = validateData(data);
          setErrorRows(errors);
          
          if (errors.length > 0) {
            toast.warning(`${errors.length} registros com problemas. Corrija os dados ou prossiga com a importação dos válidos.`);
          }
          
          // Filtrar apenas dados válidos
          const validData = data.filter((_, index) => !errors.includes(index))
                                .map(row => mapRow(row));
          
          if (validData.length === 0) {
            toast.error("Não há dados válidos para importar");
            setImporting(false);
            return;
          }
          
          // Na aplicação real, importar para o Supabase
          try {
            // Simula uma chamada ao Supabase com um timeout
            // Comentado o código real para não executar
            /*
            const { error } = await supabase
              .from('leads')
              .insert(validData.map(lead => ({
                name: lead.name,
                email: lead.email || null,
                phone: lead.phone || null,
                company: lead.company || null,
                source: lead.source || 'import',
                status: 'new'
              })));
              
            if (error) throw error;
            */
            
            // Simula um atraso na importação
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            toast.success(`Importado com sucesso: ${validData.length} leads`);
            setImportStep('success');
          } catch (error: any) {
            console.error("Erro ao importar leads:", error);
            toast.error("Erro ao importar leads: " + error.message);
          } finally {
            setImporting(false);
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          toast.error("Erro ao processar o arquivo");
          setImporting(false);
        }
      });
    } catch (error: any) {
      console.error("Erro na importação:", error);
      toast.error("Erro na importação: " + error.message);
      setImporting(false);
    }
  };
  
  // Conteúdo baseado na etapa atual
  const renderStepContent = () => {
    switch (importStep) {
      case 'upload':
        return (
          <Card className="w-full max-w-3xl mx-auto p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Importar Leads</h2>
              <p className="text-muted-foreground">
                Importe seus contatos de um arquivo CSV para adicionar múltiplos leads de uma vez
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".csv"
              />
              <div className="flex flex-col items-center justify-center">
                <Upload className="h-10 w-10 text-blue-800 mb-4" />
                <label 
                  htmlFor="file-upload"
                  className="bg-blue-800 hover:bg-blue-900 text-white py-2 px-4 rounded cursor-pointer inline-block"
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                      Verificando arquivo...
                    </>
                  ) : (
                    "Selecionar arquivo CSV"
                  )}
                </label>
                <p className="mt-4 text-sm text-muted-foreground">
                  Formato suportado: CSV (valores separados por vírgula)
                </p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar modelo
              </Button>
            </div>
          </Card>
        );
        
      case 'mapping':
        return (
          <Card className="w-full max-w-4xl mx-auto p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Mapear Campos</h2>
                <Button variant="outline" size="sm" onClick={() => setImportStep('upload')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
              <p className="text-muted-foreground">
                Associe as colunas do seu arquivo aos campos do sistema
              </p>
            </div>
            
            <div className="overflow-x-auto mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coluna do Arquivo</TableHead>
                    <TableHead>Campo do Sistema</TableHead>
                    <TableHead className="w-1/3">Exemplo de Dados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(fieldMapping).map((originalField) => (
                    <TableRow key={originalField}>
                      <TableCell className="font-medium">{originalField}</TableCell>
                      <TableCell>
                        <select
                          className="w-full p-2 border rounded-md bg-background"
                          value={fieldMapping[originalField]}
                          onChange={(e) => updateMapping(originalField, e.target.value)}
                        >
                          <option value="">Ignorar este campo</option>
                          <option value="name">Nome</option>
                          <option value="email">Email</option>
                          <option value="phone">Telefone</option>
                          <option value="company">Empresa</option>
                          <option value="source">Origem</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-sm">
                        {previewData[0] && previewData[0][originalField]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end">
              <Button 
                className="bg-blue-800 hover:bg-blue-900 text-white"
                onClick={proceedToPreview}
              >
                Continuar
              </Button>
            </div>
          </Card>
        );
        
      case 'preview':
        const errors = validateData(previewData);
        return (
          <Card className="w-full max-w-4xl mx-auto p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Prévia da Importação</h2>
                <Button variant="outline" size="sm" onClick={() => setImportStep('mapping')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
              <p className="text-muted-foreground">
                Revise os dados que serão importados antes de continuar
              </p>
            </div>
            
            {errors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Encontramos alguns problemas nos dados. Verifique as linhas destacadas em vermelho.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="overflow-x-auto mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => {
                    const mappedRow = mapRow(row);
                    const hasError = errors.includes(index);
                    
                    return (
                      <TableRow key={index} className={hasError ? "bg-red-50" : ""}>
                        <TableCell>{mappedRow.name || "-"}</TableCell>
                        <TableCell>{mappedRow.email || "-"}</TableCell>
                        <TableCell>{mappedRow.phone || "-"}</TableCell>
                        <TableCell>{mappedRow.company || "-"}</TableCell>
                        <TableCell>{mappedRow.source || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <p className="text-sm text-muted-foreground mt-2">
                Mostrando {previewData.length} de {file ? file.name : ""} (prévia dos primeiros registros)
              </p>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setImportStep('mapping')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              
              <Button 
                onClick={startImport}
                className="bg-blue-800 hover:bg-blue-900 text-white"
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Iniciar importação"
                )}
              </Button>
            </div>
          </Card>
        );
        
      case 'processing':
        return (
          <Card className="w-full max-w-md mx-auto p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-800 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Processando</h2>
            <p className="text-muted-foreground mb-6">
              Estamos importando seus leads, isso pode levar alguns instantes...
            </p>
          </Card>
        );
        
      case 'success':
        return (
          <Card className="w-full max-w-md mx-auto p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Importação concluída</h2>
            <p className="text-muted-foreground mb-6">
              Seus leads foram importados com sucesso.
            </p>
            
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setImportStep('upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Nova importação
              </Button>
              
              <Button 
                className="bg-blue-800 hover:bg-blue-900 text-white"
                onClick={() => navigate('/leads')}
              >
                Ver todos os leads
              </Button>
            </div>
          </Card>
        );
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700">
              Importar Leads
            </h1>
            <p className="text-muted-foreground">
              Importe múltiplos leads a partir de um arquivo CSV
            </p>
          </div>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para leads
          </Button>
        </div>
        
        {renderStepContent()}
      </div>
    </Layout>
  );
}

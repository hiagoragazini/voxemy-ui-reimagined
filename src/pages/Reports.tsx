
import { Layout } from '@/components/dashboard/Layout';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, LineChart, PieChart,
  CalendarRange, Download, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Reports() {
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
              Relatórios
            </h1>
            <p className="text-muted-foreground">
              Análises detalhadas e métricas do desempenho do sistema
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <CalendarRange className="h-4 w-4 mr-2" />
              Este mês
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="performance">
          <TabsList className="mb-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="usage">Uso do Sistema</TabsTrigger>
            <TabsTrigger value="calls">Chamadas</TabsTrigger>
            <TabsTrigger value="agents">Agentes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold">78.5%</p>
                    <p className="text-xs text-green-600">+3.2% vs último mês</p>
                  </div>
                  <PieChart className="h-10 w-10 text-blue-500 opacity-80" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Duração Média</p>
                    <p className="text-2xl font-bold">3:24 min</p>
                    <p className="text-xs text-amber-600">Estável vs último mês</p>
                  </div>
                  <LineChart className="h-10 w-10 text-blue-500 opacity-80" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Chamadas</p>
                    <p className="text-2xl font-bold">3,452</p>
                    <p className="text-xs text-green-600">+12% vs último mês</p>
                  </div>
                  <BarChart className="h-10 w-10 text-blue-500 opacity-80" />
                </div>
              </Card>
            </div>
            
            {/* Placeholder para gráficos */}
            <Card className="p-6 h-80 flex items-center justify-center">
              <p className="text-lg text-muted-foreground">Gráfico de performance do sistema</p>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 h-64 flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Distribuição por agentes</p>
              </Card>
              <Card className="p-6 h-64 flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Distribuição por campanhas</p>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="usage">
            <Card className="p-6 h-96 flex items-center justify-center">
              <p className="text-lg text-muted-foreground">Dados de uso do sistema serão exibidos aqui</p>
            </Card>
          </TabsContent>
          
          <TabsContent value="calls">
            <Card className="p-6 h-96 flex items-center justify-center">
              <p className="text-lg text-muted-foreground">Relatórios detalhados de chamadas serão exibidos aqui</p>
            </Card>
          </TabsContent>
          
          <TabsContent value="agents">
            <Card className="p-6 h-96 flex items-center justify-center">
              <p className="text-lg text-muted-foreground">Relatórios de performance dos agentes serão exibidos aqui</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

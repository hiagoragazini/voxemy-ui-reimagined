
import { Layout } from "@/components/dashboard/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  PhoneCall,
  User,
  UserCheck,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// Import Recharts components
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Cell,
} from "recharts";

// Dados simulados mais realistas para 10 dias de uso
const dailyCallsData = [
  { day: "01/05", calls: 142, avgTime: 3.2 },
  { day: "02/05", calls: 165, avgTime: 3.5 },
  { day: "03/05", calls: 113, avgTime: 3.7 },
  { day: "04/05", calls: 178, avgTime: 3.1 },
  { day: "05/05", calls: 196, avgTime: 2.9 },
  { day: "06/05", calls: 184, avgTime: 3.0 },
  { day: "07/05", calls: 217, avgTime: 3.2 },
  { day: "08/05", calls: 223, avgTime: 3.3 },
  { day: "09/05", calls: 245, avgTime: 3.4 },
  { day: "10/05", calls: 254, avgTime: 3.4 },
];

const successRateData = [
  { month: "Jan", taxa: 65 },
  { month: "Fev", taxa: 68 },
  { month: "Mar", taxa: 74 },
  { month: "Abr", taxa: 76 },
  { month: "Mai", taxa: 78.5 },
];

const campaignPerformanceData = [
  { name: "Black Friday", sucesso: 78, conversao: 62 },
  { name: "Reengajamento", sucesso: 65, conversao: 48 },
  { name: "Cobrança", sucesso: 42, conversao: 39 },
  { name: "Pesquisa", sucesso: 94, conversao: 25 },
  { name: "Follow-up", sucesso: 88, conversao: 71 },
];

const agentComparisonData = [
  { name: "Carlos", calls: 842, success: 76 },
  { name: "Mariana", calls: 967, success: 92 },
  { name: "Roberto", calls: 513, success: 68 },
  { name: "Ana", calls: 621, success: 81 },
  { name: "Paulo", calls: 453, success: 89 },
];

const callReasonData = [
  { name: "Suporte", value: 35 },
  { name: "Vendas", value: 28 },
  { name: "Informação", value: 22 },
  { name: "Reclamação", value: 15 },
];

const COLORS = ["#1e40af", "#3b82f6", "#0369a1", "#0284c7"];

export default function Analytics() {
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700">
            Analytics e Performance
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Visualize estatísticas, tendências e performance dos seus agentes e campanhas.
          </p>
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="agents">Agentes</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatisticCard
                title="Chamadas Hoje"
                value="254"
                change={"+23"}
                changeType="positive"
                icon={<PhoneCall />}
              />
              <StatisticCard
                title="Taxa de Sucesso"
                value="78.5%"
                change={"+3.5%"}
                changeType="positive"
                icon={<TrendingUp />}
              />
              <StatisticCard
                title="Tempo Médio"
                value="3:24"
                change={"-0:12"}
                changeType="positive"
                icon={<Clock />}
              />
              <StatisticCard
                title="Agentes Ativos"
                value="5"
                change={"+1"}
                changeType="positive"
                icon={<User />}
              />
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Chamadas por Dia</CardTitle>
                    <Badge variant="secondary">Últimos 10 dias</Badge>
                  </div>
                  <CardDescription>Total de chamadas realizadas por dia</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyCallsData}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px"
                        }} 
                      />
                      <Bar dataKey="calls" fill="#1e40af" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Taxa de Sucesso</CardTitle>
                    <Badge variant="secondary">Este ano</Badge>
                  </div>
                  <CardDescription>Evolução da taxa de sucesso ao longo dos meses</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={successRateData}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                      <XAxis dataKey="month" />
                      <YAxis domain={[60, 85]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px"
                        }} 
                        formatter={(value) => [`${value}%`, "Taxa"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="taxa" 
                        stroke="#1e40af" 
                        fill="#1e40af40" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Performance dos Agentes</CardTitle>
                    <Badge variant="secondary">Top 5</Badge>
                  </div>
                  <CardDescription>Comparação entre número de chamadas e taxa de sucesso</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agentComparisonData}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                      barCategoryGap={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px"
                        }} 
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="calls" name="Chamadas" fill="#1e40af" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="success" name="Sucesso (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Distribuição de Chamadas</CardTitle>
                    <Badge variant="secondary">Por categoria</Badge>
                  </div>
                  <CardDescription>Principais razões para chamadas realizadas</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <Pie
                        data={callReasonData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {callReasonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px"
                        }} 
                        formatter={(value) => [`${value}%`, "Percentual"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <div className="grid gap-6 grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Performance Detalhada de Agentes</CardTitle>
                  <CardDescription>Análise comparativa entre os agentes ativos</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agentComparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                      <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px"
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="calls" name="Chamadas Realizadas" fill="#1e40af" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="success" name="Taxa de Sucesso (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            <div className="grid gap-6 grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Performance das Campanhas</CardTitle>
                  <CardDescription>Taxa de sucesso e conversão por campanha</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaignPerformanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                      <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px"
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="sucesso" name="Taxa de Sucesso (%)" fill="#1e40af" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="conversao" name="Taxa de Conversão (%)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Utility component for statistic cards
interface StatisticCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

const StatisticCard = ({ title, value, change, changeType, icon }: StatisticCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-800">
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold">{value}</div>
          <div className={`flex items-center space-x-1 text-sm ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            {changeType === 'positive' ? (
              <ChevronUp className="h-4 w-4" />
            ) : changeType === 'negative' ? (
              <ChevronDown className="h-4 w-4" />
            ) : null}
            <span>{change}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

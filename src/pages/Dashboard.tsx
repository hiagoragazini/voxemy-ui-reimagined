
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { TopAgentsSection } from "@/components/dashboard/TopAgentsSection";
import { NextStepsSection } from "@/components/dashboard/NextStepsSection";
import { Header } from "@/components/dashboard/Header";
import { Layout } from "@/components/dashboard/Layout";
import { VapiIntegrationCheck } from "@/components/dashboard/VapiIntegrationCheck";

export default function Dashboard() {
  return (
    <Layout>
      <Header />
      <div className="py-6">
        <StatsOverview />
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <VapiIntegrationCheck />
          <NextStepsSection />
        </div>
        
        <div className="mt-6">
          <TopAgentsSection />
        </div>
      </div>
    </Layout>
  );
}


import { Layout } from '@/components/dashboard/Layout';
import { TwilioBasicTester } from '@/components/test/TwilioBasicTester';

export default function TwilioTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Diagnóstico de Integração Twilio</h1>
        <p className="mb-8 text-gray-600">
          Esta página contém ferramentas para diagnosticar problemas com a integração Twilio,
          utilizando TwiML simples e testando apenas as funcionalidades básicas.
        </p>
        
        <TwilioBasicTester />
      </div>
    </Layout>
  );
}

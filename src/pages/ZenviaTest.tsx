
import { Layout } from '@/components/dashboard/Layout';
import { ZenviaManualTester } from '@/components/test/ZenviaManualTester';

export default function ZenviaTestPage() {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Teste de Integração Zenvia</h1>
        <p className="mb-8 text-gray-600">
          Esta página contém ferramentas para testar a integração com a Zenvia,
          permitindo realizar chamadas e testar o fluxo de diálogo interativo.
        </p>
        
        <ZenviaManualTester />
      </div>
    </Layout>
  );
}

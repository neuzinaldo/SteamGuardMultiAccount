import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { Layout } from './components/Layout';
import { CategoryModal } from './components/CategoryModal';

function App() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm mode={authMode} onModeChange={setAuthMode} />;
  }

  const handleGenerateMonthlyReport = () => {
    // Disparar evento para o TransactionList gerar relatório mensal
    window.dispatchEvent(new CustomEvent('generateMonthlyReport'));
  };

  const handleGenerateAnnualReport = () => {
    // Disparar evento para o TransactionList gerar relatório anual
    window.dispatchEvent(new CustomEvent('generateAnnualReport'));
  };
  // Renderizar o layout principal com as abas
  return (
    <>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onGenerateMonthlyReport={handleGenerateMonthlyReport}
        onGenerateAnnualReport={handleGenerateAnnualReport}
      >
        {activeTab === 'dashboard' ? <Dashboard /> : <TransactionList />}
      </Layout>
      
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </>
  );
}

export default App;
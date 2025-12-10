import React, { useState } from 'react';
import MobileSelector from './MobileSelector';
import FrameCustomizer from './FrameCustomizer';

const App = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [currentStep, setCurrentStep] = useState('select'); // 'select' or 'customize'

  const handlePhoneSelect = (company, model) => {
    setSelectedCompany(company);
    setSelectedModel(model);
    if (model) {
      setCurrentStep('customize');
    }
  };

  const handleBack = () => {
    if (currentStep === 'customize') {
      setCurrentStep('select');
      setSelectedModel(null);
    }
  };

  const handleSave = (design) => {
    // Handle saving the design (could send to API or store locally)
    console.log('Design saved:', design);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Mobile Cover Customizer</h1>
          {currentStep === 'customize' && (
            <button
              onClick={handleBack}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              ← Back to phone selection
            </button>
          )}
        </div>
      </header>

      <main className="py-8">
        {currentStep === 'select' && (
          <MobileSelector
            onSelect={handlePhoneSelect}
            selectedCompany={selectedCompany}
            selectedModel={selectedModel}
          />
        )}

        {currentStep === 'customize' && selectedModel && (
          <FrameCustomizer
            selectedModel={selectedModel}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  );
};

export default App;

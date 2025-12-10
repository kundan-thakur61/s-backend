import React, { useState } from 'react';

const MobileSelector = ({ onSelect, selectedCompany, selectedModel }) => {
  const [companies] = useState([
    {
      name: 'Apple',
      models: [
        { name: 'iPhone 14', framePath: '/frames/Apple/iPhone14.png' },
        { name: 'iPhone 15', framePath: '/frames/Apple/iPhone15.png' }
      ]
    },
    {
      name: 'Samsung',
      models: [
        { name: 'Galaxy S23', framePath: '/frames/Samsung/S23.png' },
        { name: 'Galaxy S24', framePath: '/frames/Samsung/S24.png' }
      ]
    },
    {
      name: 'Vivo',
      models: [
        { name: 'Vivo V25', framePath: '/frames/Vivo/V25.png' },
        { name: 'Vivo X80', framePath: '/frames/Vivo/X80.png' }
      ]
    },
    {
      name: 'Oppo',
      models: [
        { name: 'Oppo Reno 10', framePath: '/frames/Oppo/Reno10.png' },
        { name: 'Oppo Find X5', framePath: '/frames/Oppo/FindX5.png' }
      ]
    },
    {
      name: 'Xiaomi',
      models: [
        { name: 'Redmi Note 12', framePath: '/frames/Xiaomi/RedmiNote12.png' },
        { name: 'Mi 13', framePath: '/frames/Xiaomi/Mi13.png' }
      ]
    }
  ]);

  const handleCompanySelect = (company) => {
    onSelect(company, null);
  };

  const handleModelSelect = (model) => {
    onSelect(selectedCompany, model);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Select Your Phone</h2>

      {/* Company Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Choose Company</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {companies.map((company) => (
            <button
              key={company.name}
              onClick={() => handleCompanySelect(company)}
              className={`p-4 border-2 rounded-lg text-center transition-colors ${
                selectedCompany?.name === company.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{company.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      {selectedCompany && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Choose Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCompany.models.map((model) => (
              <button
                key={model.name}
                onClick={() => handleModelSelect(model)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  selectedModel?.name === model.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{model.name}</div>
                <div className="text-sm text-gray-500 mt-1">Custom back cover available</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSelector;

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModelConfig {
  provider: 'deepseek' | 'openai' | 'qwen' | 'zhipu';
  apiKey: string;
  model: string;
}

interface ModelConfigContextType {
  config: ModelConfig;
  setConfig: (config: ModelConfig) => void;
  isConfigured: boolean;
}

const defaultConfig: ModelConfig = {
  provider: 'deepseek',
  apiKey: '',
  model: 'deepseek-chat',
};

const ModelConfigContext = createContext<ModelConfigContextType | undefined>(undefined);

export const ModelConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<ModelConfig>(() => {
    const saved = localStorage.getItem('modelConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  const setConfig = useCallback((newConfig: ModelConfig) => {
    setConfigState(newConfig);
    localStorage.setItem('modelConfig', JSON.stringify(newConfig));
  }, []);

  const isConfigured = config.apiKey.length > 0;

  return (
    <ModelConfigContext.Provider value={{ config, setConfig, isConfigured }}>
      {children}
    </ModelConfigContext.Provider>
  );
};

export const useModelConfig = () => {
  const context = useContext(ModelConfigContext);
  if (!context) {
    throw new Error('useModelConfig must be used within ModelConfigProvider');
  }
  return context;
};

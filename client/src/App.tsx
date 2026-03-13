import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Brain, RotateCcw, BarChart3, GitCompare, Home, Scale, LineChart } from 'lucide-react';
import { CoTEvaluateMode } from '@/modes/CoTEvaluateMode';
import { ReactIterateMode } from '@/modes/ReactIterateMode';
import ModelComparisonMode from '@/modes/ModelComparisonMode';
import LearningInsights from '@/pages/LearningInsights';
import { ModelConfigProvider } from '@/contexts/ModelConfigContext';
import EvaluateMode from '@/modes/EvaluateMode';
import { IterateMode } from '@/modes/IterateMode';

const Dashboard: React.FC = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
    <p className="text-gray-500">欢迎使用 PromptCraft V5</p>
    <div className="mt-4 space-y-2">
      <NavLink to="/evaluate-cot" className="block text-purple-600 hover:underline">→ CoT评估模式</NavLink>
      <NavLink to="/iterate-react" className="block text-blue-600 hover:underline">→ ReAct迭代模式</NavLink>
      <NavLink to="/compare" className="block text-green-600 hover:underline">→ 多模型对比</NavLink>
      <NavLink to="/insights" className="block text-orange-600 hover:underline">→ 个人学习洞察</NavLink>
    </div>
  </div>
);

const Navigation: React.FC = () => {
  const navItems = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/evaluate', icon: BarChart3, label: '评估' },
    { to: '/evaluate-cot', icon: Brain, label: 'CoT评估' },
    { to: '/iterate', icon: GitCompare, label: '迭代' },
    { to: '/iterate-react', icon: RotateCcw, label: 'ReAct迭代' },
    { to: '/compare', icon: Scale, label: '多模型对比' },
    { to: '/insights', icon: LineChart, label: '学习洞察' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-900">PromptCraft V5</span>
          </div>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <ModelConfigProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/evaluate" element={<EvaluateMode />} />
              <Route path="/evaluate-cot" element={<CoTEvaluateMode />} />
              <Route path="/iterate" element={<IterateMode />} />
              <Route path="/iterate-react" element={<ReactIterateMode />} />
              <Route path="/compare" element={<ModelComparisonMode />} />
              <Route path="/insights" element={<LearningInsights />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ModelConfigProvider>
  );
};

export default App;
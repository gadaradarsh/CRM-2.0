import React from 'react';

const LoadingSpinner = ({ size = 'lg', text = 'Loading...' }) => {
  const isFullPage = size === 'lg';
  const spinnerSize = size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12';

  if (isFullPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#f5f4ff' }}>
        <div className="relative">
          <div className={`${spinnerSize} rounded-full`}
            style={{ border: '3px solid #ede9ff', borderTopColor: '#6c63ff', animation: 'spin 0.8s linear infinite' }} />
          <div className="absolute inset-0 rounded-full"
            style={{ border: '3px solid transparent', borderTopColor: 'rgba(108,99,255,0.2)', animation: 'spin 1.6s linear infinite reverse' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>{text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12 gap-3">
      <div className={`${spinnerSize} rounded-full`}
        style={{ border: '2.5px solid #ede9ff', borderTopColor: '#6c63ff', animation: 'spin 0.8s linear infinite' }} />
      {size === 'md' && <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

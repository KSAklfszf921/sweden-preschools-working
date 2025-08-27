import React from 'react';

export const TestMap: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`${className} bg-blue-500 flex items-center justify-center`}>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold z-50 shadow-lg">
        ✅ TEST MAP AKTIV - FUNGERAR DETTA?
      </div>
      <h1 className="text-white text-4xl font-bold">TEST MAP</h1>
    </div>
  );
};
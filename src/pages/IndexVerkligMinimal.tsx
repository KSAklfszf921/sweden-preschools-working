import { Suspense } from 'react';
import { useUltraLitePreschools } from '@/hooks/useUltraLitePreschools';
import UltraSimpleMap from '@/components/UltraSimpleMap';

const IndexVerkligMinimal = () => {
  const { isLoading, error } = useUltraLitePreschools();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Fel vid laddning</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Suspense fallback={<div className="w-full h-full bg-gray-100" />}>
        <UltraSimpleMap />
      </Suspense>
    </div>
  );
};

export default IndexVerkligMinimal;
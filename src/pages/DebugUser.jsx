import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function DebugUser() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['debugUser'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) return <div className="p-8">Cargando...</div>;
  if (error) return <div className="p-8">Error: {error.message}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Usuario</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
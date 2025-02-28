import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

export default function BackButton() {
  const router = useRouter();

  // Nicht auf der Hauptseite oder Dashboard anzeigen
  if (router.pathname === '/' || router.pathname === '/dashboard') {
    return null;
  }

  return (
    <button
      onClick={() => router.back()}
      className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
    >
      <ArrowLeftIcon className="mr-1 h-4 w-4" />
      Zurück
    </button>
  );
} 
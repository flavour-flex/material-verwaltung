import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowUpTrayIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon
  },
  {
    name: 'Hauptlager',
    href: '/hauptlager',
    icon: BuildingOfficeIcon
  },
  {
    name: 'Bestellungen',
    href: '/bestellungen',
    icon: ClipboardDocumentListIcon
  },
  {
    name: 'Einstellungen',
    href: '/einstellungen',
    icon: Cog6ToothIcon
  },
  {
    name: 'API Dokumentation',
    href: '/api-docs',
    icon: CodeBracketIcon
  },
  {
    name: 'Ausbuchungen',
    href: '/ausbuchungen',
    icon: ArrowUpTrayIcon
  }
];

const Navigation = () => {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  
  const showStandorte = userRole === 'ADMIN' || 
                        userRole === 'STANDORT_VERANTWORTLICHER';

  return (
    <nav>
      {navigation.map((item) => (
        <Link key={item.name} href={item.href} className="menu-item">
          {item.name}
        </Link>
      ))}
      
      {showStandorte && (
        <Link href="/standorte" className="menu-item">
          Standorte
        </Link>
      )}
    </nav>
  );
};

export default Navigation; 
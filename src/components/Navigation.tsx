import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowUpTrayIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

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

// ... Rest der Komponente 
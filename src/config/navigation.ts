import { 
  HomeIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  WrenchScrewdriverIcon,
  BuildingStorefrontIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

export const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Warenwirtschaft',
    icon: CubeIcon,
    children: [
      {
        name: 'Bestellungen',
        icon: ClipboardDocumentListIcon,
        children: [
          {
            name: 'Neue Bestellung',
            href: '/bestellungen/neu',
            icon: ShoppingCartIcon
          },
          {
            name: 'Meine Bestellungen',
            href: '/bestellungen',
            icon: ClipboardDocumentListIcon
          }
        ]
      },
      {
        name: 'Verwaltung',
        icon: WrenchScrewdriverIcon,
        children: [
          {
            name: 'Hauptlager',
            href: '/hauptlager',
            icon: BuildingStorefrontIcon
          },
          {
            name: 'Standorte',
            href: '/standorte',
            icon: BuildingOfficeIcon
          },
          {
            name: 'Artikel',
            href: '/artikel',
            icon: ArchiveBoxIcon
          },
          {
            name: 'Ausbuchungen',
            href: '/ausbuchungen',
            icon: ArrowUpTrayIcon
          }
        ]
      }
    ]
  },
  {
    name: 'Einstellungen',
    href: '/einstellungen',
    icon: Cog6ToothIcon
  }
]; 
import { Fragment, useState, useEffect, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  ArrowRightOnRectangleIcon,
  ArrowUpTrayIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { classNames } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon
  },
  {
    name: 'WARENWIRTSCHAFT',
    icon: CubeIcon,
    children: [
      {
        name: 'Bestellungen',
        icon: ClipboardDocumentListIcon,
        children: [
          {
            name: 'Bestellungen Übersicht',
            href: '/bestellungen',
            icon: ClipboardDocumentListIcon
          },
          {
            name: 'Bestellung aufgeben',
            href: '/bestellungen/neu',
            icon: ShoppingCartIcon
          }
        ]
      },
      {
        name: 'Stammdaten',
        icon: ArchiveBoxIcon,
        children: [
          {
            name: 'Standorte',
            href: '/standorte',
            icon: BuildingOfficeIcon
          },
          {
            name: 'Artikel',
            href: '/artikel',
            icon: ArchiveBoxIcon
          }
        ]
      },
      {
        name: 'Verwaltung',
        icon: WrenchScrewdriverIcon,
        children: [
          {
            name: 'Bestellungen verwalten',
            href: '/hauptlager',
            icon: BuildingStorefrontIcon
          },
          {
            name: 'Ausbuchungen',
            href: '/ausbuchungen',
            icon: ArrowUpTrayIcon
          }
        ]
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
      }
    ]
  }
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  
  // Initialisiere expandedItems mit Werten aus localStorage
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('menuState');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Speichere Änderungen im localStorage
  useEffect(() => {
    localStorage.setItem('menuState', JSON.stringify(expandedItems));
  }, [expandedItems]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      toast.success('Erfolgreich abgemeldet');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Fehler beim Abmelden');
    }
  };

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const renderNavItem = (item: any, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.name];
    
    return (
      <div key={item.name} className={`${depth > 0 ? 'ml-4' : ''}`}>
        {item.href ? (
          <Link
            href={item.href}
            className={classNames(
              router.pathname === item.href
                ? 'bg-indigo-800 text-white'
                : 'text-indigo-100 hover:bg-indigo-600',
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
            )}
          >
            <item.icon className="mr-3 h-6 w-6 flex-shrink-0" aria-hidden="true" />
            {item.name}
          </Link>
        ) : (
          <button
            onClick={() => toggleExpand(item.name)}
            className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-indigo-100 hover:bg-indigo-600"
          >
            <item.icon className="mr-3 h-6 w-6 flex-shrink-0" aria-hidden="true" />
            {item.name}
            {hasChildren && (
              isExpanded 
                ? <ChevronUpIcon className="ml-auto h-5 w-5" />
                : <ChevronDownIcon className="ml-auto h-5 w-5" />
            )}
          </button>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children.map((child: any) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div>Laden...</div>;
  }

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-700 px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <img
                      className="h-8 w-auto"
                      src="/logo.png"
                      alt="Logo"
                    />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map(item => renderNavItem(item))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-700 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <img
              className="h-8 w-auto"
              src="/logo.png"
              alt="Logo"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map(item => renderNavItem(item))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <main className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 
import { Fragment, useState, useEffect } from 'react';
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

export default function Layout({ children }: { children: React.ReactNode }) {
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
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              router.pathname === item.href
                ? 'bg-indigo-800 text-white'
                : 'text-indigo-100 hover:bg-indigo-600'
            }`}
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
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-40 lg:hidden">
        <button
          type="button"
          className="p-2 m-2 text-gray-500 hover:text-gray-600"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Menü öffnen</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-indigo-700">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Menü schließen</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4">
                    <img
                      className="h-12 w-auto"
                      src="/logo.png"
                      alt="Logo"
                    />
                  </div>
                  <nav className="mt-5 px-2 space-y-1">
                    {navigation.map(item => renderNavItem(item))}
                  </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
                  <button
                    onClick={handleLogout}
                    className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-indigo-100 hover:bg-indigo-600 w-full"
                  >
                    <ArrowRightOnRectangleIcon
                      className="mr-3 h-6 w-6 flex-shrink-0 text-indigo-300"
                      aria-hidden="true"
                    />
                    Abmelden
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="w-14 flex-shrink-0">{/* Force sidebar to shrink to fit close icon */}</div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-indigo-700">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <img
                className="h-12 w-auto"
                src="/logo.png"
                alt="Logo"
              />
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map(item => renderNavItem(item))}
            </nav>
          </div>
          {/* Abmelden Button */}
          <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
            <button
              onClick={handleLogout}
              className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-indigo-100 hover:bg-indigo-600 w-full"
            >
              <ArrowRightOnRectangleIcon
                className="mr-3 h-6 w-6 flex-shrink-0 text-indigo-300 group-hover:text-indigo-200"
                aria-hidden="true"
              />
              Abmelden
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile menu button */}
        <div className="sticky top-0 z-10 lg:hidden">
          <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Menü öffnen</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
                  {navigation.find(item => 
                    item.href === router.pathname || 
                    item.children?.some(child => child.href === router.pathname)
                  )?.name || 'Dashboard'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
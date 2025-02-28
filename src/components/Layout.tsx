import { Fragment, useEffect } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
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
  ArrowUpTrayIcon,
  CodeBracketIcon,
  CubeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { classNames } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/ui/BackButton';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: NavigationItem[];
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, isAdmin, userRole } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleFocus = () => {
      supabase.auth.startAutoRefresh();
      queryClient.invalidateQueries();
    };

    const handleBlur = () => {
      supabase.auth.stopAutoRefresh();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [queryClient]);

  const handleLogout = async () => {
    try {
      // Zeige Loading-Toast
      const loadingToast = toast.loading('Abmelden...');

      // Erst die Session holen
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Wenn keine Session existiert, direkt zur Login-Seite
        toast.dismiss(loadingToast);
        window.location.href = '/login';
        return;
      }

      // Cache leeren
      queryClient.clear();

      // Session beenden
      await supabase.auth.signOut();

      // Loading-Toast entfernen
      toast.dismiss(loadingToast);
      toast.success('Erfolgreich abgemeldet');

      // Kurze Verzögerung für die Toast-Anzeige
      setTimeout(() => {
        // Zur Login-Seite navigieren
        window.location.href = '/login';
      }, 100);

    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Fehler beim Abmelden');
      
      // Im Fehlerfall trotzdem zur Login-Seite
      window.location.href = '/login';
    }
  };

  const handleNavigation = (href?: string) => {
    if (href) {
      router.push(href);
    }
  };

  const navigation: NavigationItem[] = [
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
            },
            {
              name: 'Hardware',
              href: '/hardware',
              icon: WrenchScrewdriverIcon
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Disclosure as="nav" className="sticky top-0 z-40 w-full bg-[#023770] shadow-lg">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img className="h-8 w-auto" src="/logo.png" alt="Logo" />
                  </div>
                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        <Fragment key={item.name}>
                          {!item.children ? (
                            <button
                              onClick={() => handleNavigation(item.href)}
                              className={classNames(
                                router.pathname === item.href
                                  ? 'bg-[#023770]/10 text-white'
                                  : 'text-gray-300 hover:bg-[#023770]/20 hover:text-white',
                                'px-3 py-2 rounded-md text-sm font-medium'
                              )}
                            >
                              {item.name}
                            </button>
                          ) : (
                            <Menu as="div" className="relative">
                              <Menu.Button
                                className={classNames(
                                  'text-gray-300 hover:bg-[#023770]/20 hover:text-white',
                                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1'
                                )}
                              >
                                {item.name}
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </Menu.Button>
                              <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    {item.children?.map((child) => (
                                      <div key={child.name}>
                                        {child.href ? (
                                          <Menu.Item>
                                            {({ active }) => (
                                              <button
                                                onClick={() => handleNavigation(child.href)}
                                                className={classNames(
                                                  active ? 'bg-gray-100' : '',
                                                  'block w-full text-left px-4 py-2 text-sm text-gray-700'
                                                )}
                                              >
                                                <span className="flex items-center">
                                                  <child.icon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                                  {child.name}
                                                </span>
                                              </button>
                                            )}
                                          </Menu.Item>
                                        ) : (
                                          <div className="px-4 py-2">
                                            <span className="flex items-center text-xs font-semibold text-gray-500">
                                              <child.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                                              {child.name}
                                            </span>
                                            <div className="ml-8 mt-1">
                                              {child.children?.map((subChild) => (
                                                <Menu.Item key={subChild.name}>
                                                  {({ active }) => (
                                                    <button
                                                      onClick={() => handleNavigation(subChild.href)}
                                                      className={classNames(
                                                        active ? 'bg-gray-100' : '',
                                                        'block w-full text-left px-4 py-2 text-sm text-gray-700'
                                                      )}
                                                    >
                                                      <span className="flex items-center">
                                                        <subChild.icon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                                        {subChild.name}
                                                      </span>
                                                    </button>
                                                  )}
                                                </Menu.Item>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          )}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:ml-6 sm:flex sm:items-center">
                  <div className="flex items-center mr-4 text-gray-300">
                    <span className="text-sm">{user?.email}</span>
                    <span className="mx-2">•</span>
                    <span className="text-sm capitalize">{userRole || 'Benutzer'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#023770]/20 hover:text-white rounded-md"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Abmelden
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </Disclosure>

      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BackButton />
          <div className="bg-white shadow-sm rounded-lg p-6 min-h-[500px] relative">
            <Transition
              show={true}
              enter="transition-opacity duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              {/* Skeleton Loader */}
              <div className="absolute inset-0 bg-white rounded-lg p-6" 
                   style={{ display: children ? 'none' : 'block' }}>
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Actual Content */}
              <div className={`transition-opacity duration-200 ${children ? 'opacity-100' : 'opacity-0'}`}>
                {children}
              </div>
            </Transition>
          </div>
        </div>
      </main>
    </div>
  );
}

// Neue Komponente für den Seiteninhalt
export function PageContent({ children, isLoading }: { children: React.ReactNode, isLoading?: boolean }) {
  return (
    <Transition
      show={!isLoading}
      enter="transition-opacity duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      {children}
    </Transition>
  );
} 
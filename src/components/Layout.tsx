import { Fragment } from 'react';
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
  CubeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { classNames } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      queryClient.clear();
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = '/login';
      toast.success('Erfolgreich abgemeldet');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Fehler beim Abmelden');
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
                          {item.href ? (
                            <Link
                              href={item.href}
                              className={classNames(
                                router.pathname === item.href
                                  ? 'bg-[#023770]/10 text-white'
                                  : 'text-gray-300 hover:bg-[#023770]/20 hover:text-white',
                                'px-3 py-2 rounded-md text-sm font-medium'
                              )}
                            >
                              {item.name}
                            </Link>
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
                                              <Link
                                                href={child.href}
                                                className={classNames(
                                                  active ? 'bg-gray-100' : '',
                                                  'block px-4 py-2 text-sm text-gray-700'
                                                )}
                                              >
                                                <span className="flex items-center">
                                                  <child.icon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                                  {child.name}
                                                </span>
                                              </Link>
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
                                                    <Link
                                                      href={subChild.href}
                                                      className={classNames(
                                                        active ? 'bg-gray-100' : '',
                                                        'block px-4 py-2 text-sm text-gray-700 rounded-md'
                                                      )}
                                                    >
                                                      <span className="flex items-center">
                                                        <subChild.icon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                                                        {subChild.name}
                                                      </span>
                                                    </Link>
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
                  <Menu as="div" className="relative ml-3">
                    <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#023770]">
                      <span className="sr-only">Benutzermenü öffnen</span>
                      <div className="h-8 w-8 rounded-full bg-[#023770]/10 flex items-center justify-center text-[#023770]">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block w-full px-4 py-2 text-left text-sm text-gray-700'
                              )}
                            >
                              Abmelden
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          </>
        )}
      </Disclosure>

      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
} 
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Root-Route auf Dashboard umleiten für Admins
    if (userData?.role === 'admin' && req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Wenn kein Admin und versucht auf geschützte Routen zuzugreifen
    if (userData?.role !== 'admin' && (
      req.nextUrl.pathname.startsWith('/admin') ||
      req.nextUrl.pathname.startsWith('/hauptlager') ||
      req.nextUrl.pathname.startsWith('/einstellungen') ||
      req.nextUrl.pathname.startsWith('/api-docs')
    )) {
      return NextResponse.redirect(new URL('/bestellungen/neu', req.url));
    }

    // Wenn Standortverantwortlicher
    if (userData?.role === 'standortverantwortlich') {
      // Root und Dashboard zu Bestellungen umleiten
      if (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/bestellungen/neu', req.url));
      }

      // Erlaube Zugriff auf /standorte und Details seiner Standorte
      if (req.nextUrl.pathname.startsWith('/standorte')) {
        // Wenn es eine spezifische Standort-ID ist, prüfe die Berechtigung
        const standortId = req.nextUrl.pathname.split('/')[2];
        if (standortId && standortId !== 'neu') {
          const { data: standort } = await supabase
            .from('standorte')
            .select('verantwortliche')
            .eq('id', standortId)
            .single();

          // Prüfe ob der User für diesen Standort verantwortlich ist
          const isResponsible = standort?.verantwortliche?.some(
            (v: any) => v.email === session.user.email
          );

          if (!isResponsible) {
            return NextResponse.redirect(new URL('/bestellungen/neu', req.url));
          }
        }
        return res;
      }
      
      // Blockiere nicht erlaubte Routen
      if (
        req.nextUrl.pathname === '/artikel' ||
        req.nextUrl.pathname === '/dashboard'
      ) {
        return NextResponse.redirect(new URL('/bestellungen/neu', req.url));
      }
    }
  }

  return res;
}

// Optional: Definiere die Pfade, für die die Middleware ausgeführt werden soll
export const config = {
  matcher: [
    '/admin/:path*',
    '/hauptlager/:path*',
    '/einstellungen/:path*',
    '/api-docs/:path*',
    '/bestellungen/:path*',
    '/artikel/:path*',
    '/standorte/:path*',
  ],
}; 
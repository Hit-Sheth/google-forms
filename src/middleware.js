import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Static assets and internal next paths should be ignored
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  let user = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
      });
      user = payload;
    } catch (e) {
      // Invalid token
    }
  }

  // Define route rules
  const isAdminRoute = pathname.startsWith('/admin');
  const isEmployeeRoute = pathname.startsWith('/employee');
  const isCustomerRoute = pathname.startsWith('/customer');
  const isFormFillingRoute = pathname.startsWith('/forms');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // 1. If not logged in and trying to access protected routes, redirect to /login
  if (!user) {
    if (isAdminRoute || isEmployeeRoute || isCustomerRoute || isFormFillingRoute) {
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. If logged in and trying to access /login or /register, redirect to dashboard
  if (isAuthRoute) {
    if (user.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else if (user.role === 'employee') {
      return NextResponse.redirect(new URL('/employee/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/customer/dashboard', request.url));
    }
  }

  // 3. Admin routes: require admin role
  if (isAdminRoute && user.role !== 'admin') {
    return redirectToDashboard(user.role, request.url);
  }

  // 4. Employee routes: require employee or admin role
  if (isEmployeeRoute && user.role !== 'employee' && user.role !== 'admin') {
    return redirectToDashboard(user.role, request.url);
  }

  // 5. Customer routes: require customer role
  if (isCustomerRoute && user.role !== 'customer') {
    return redirectToDashboard(user.role, request.url);
  }

  // 6. Form filling route (/forms/[id]): Allow everyone through. 
  // Granular permissions (like canSubmit) are securely handled by the API and Page logic.
  if (isFormFillingRoute && !['customer', 'employee', 'admin'].includes(user.role)) {
    return redirectToDashboard(user.role, request.url);
  }

  return NextResponse.next();
}

function redirectToDashboard(role, baseUrl) {
  if (role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', baseUrl));
  } else if (role === 'employee') {
    return NextResponse.redirect(new URL('/employee/dashboard', baseUrl));
  } else {
    return NextResponse.redirect(new URL('/customer/dashboard', baseUrl));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
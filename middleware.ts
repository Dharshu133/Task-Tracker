import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_API_ROUTES = ['/api/auth/login'];

// Edge-compatible JWT verification using Web Crypto API
async function verifyJWT(token: string): Promise<{
  userId: string;
  email: string;
  role: string;
  orgId: string;
  assignedProjectId?: string | null;
} | null> {
  try {
    const secret = process.env.JWT_SECRET!;
    const encoder = new TextEncoder();

    // Decode JWT parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Import key
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify signature
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify('HMAC', cryptoKey, signature, data);
    if (!valid) return null;

    // Decode payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      orgId: payload.orgId,
      assignedProjectId: payload.assignedProjectId,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-org-id', payload.orgId);
  if (payload.assignedProjectId) {
    requestHeaders.set('x-user-assigned-project-id', payload.assignedProjectId);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: '/api/:path*',
};

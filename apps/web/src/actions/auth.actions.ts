'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverFetch } from '@/lib/api-client';

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function applyCookiesFromResponse(res: Response, fallbackAccessToken?: string) {
  const setCookieHeaders = res.headers.getSetCookie();
  const cookieStore = cookies();

  setCookieHeaders.forEach((rawCookie) => {
    const parts = rawCookie.split(';');
    const [nameValue, ...attrs] = parts;
    const [name, ...valParts] = nameValue.split('=');
    const value = valParts.join('=');

    const options: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
      maxAge?: number;
      path?: string;
    } = { path: '/' };

    attrs.forEach((attr) => {
      const trimmed = attr.trim().toLowerCase();
      if (trimmed === 'httponly') options.httpOnly = true;
      if (trimmed === 'secure') options.secure = true;
      if (trimmed.startsWith('samesite=strict')) options.sameSite = 'strict';
      if (trimmed.startsWith('samesite=lax')) options.sameSite = 'lax';
      if (trimmed.startsWith('max-age=')) {
        options.maxAge = parseInt(trimmed.replace('max-age=', ''), 10);
      }
    });

    cookieStore.set(name.trim(), value, options);
  });

  if (fallbackAccessToken) {
    cookieStore.set('access_token', fallbackAccessToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = ((formData.get('email') as string) || (formData.get('account_selector') as string) || '').trim();
  const password = formData.get('password') as string;
  const rememberMe = formData.get('rememberMe') === 'on' || formData.get('rememberMe') === 'true';

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { error: data?.message || data?.error?.message || 'Invalid credentials' };
    }

    applyCookiesFromResponse(res, data?.data?.accessToken);

    return {
      success: true,
      user: data.data.user,
      rememberToken: data.data.rememberToken,
      rememberExpiresAt: data.data.rememberExpiresAt,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return { error: msg };
  }
}

export async function rememberLoginAction(params: {
  rememberToken: string;
  userId?: string;
}) {
  if (!params.rememberToken) {
    return { error: 'Remember token is required' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/remember-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { error: data?.message || data?.error?.message || 'Session expired. Please log in manually.' };
    }

    applyCookiesFromResponse(res, data?.data?.accessToken);

    return {
      success: true,
      user: data.data.user,
      rememberToken: data.data.rememberToken,
      rememberExpiresAt: data.data.rememberExpiresAt,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Remember-me login failed';
    return { error: msg };
  }
}

export async function registerAction(prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'Name, email, and password are required' };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { error: data?.message || data?.error?.message || 'Registration failed' };
    }

    applyCookiesFromResponse(res, data?.data?.accessToken);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return { error: msg };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  await serverFetch('/api/v1/auth/logout', { method: 'POST' });
  const cookieStore = cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  redirect('/login');
}

export async function getCurrentUserAction() {
  try {
    const res = await serverFetch<{
      id: string;
      email: string;
      name: string;
      avatarUrl?: string;
      memberships: Array<{
        role: string;
        workspace: { id: string; name: string; slug: string };
      }>;
    }>('/api/v1/auth/me');

    if (!res.success) {
      return null;
    }
    return res.data;
  } catch {
    return null;
  }
}

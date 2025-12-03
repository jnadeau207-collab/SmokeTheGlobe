// src/app/api/v1/auth.ts
import { cookies, headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../../lib/database.types';

export type UserRole = 'business_owner' | 'admin' | 'viewer';

export interface AuthContext {
  userId: string;
  role: UserRole;
}

function getBearerTokenFromHeaders(): string | null {
  const hdrs = headers();
  const auth = hdrs.get('authorization') || hdrs.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export async function requireAuthWithRole(requiredRoles: UserRole[]): Promise<AuthContext> {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  let {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    const bearer = getBearerTokenFromHeaders();
    if (!bearer) {
      throw Object.assign(new Error('Unauthorized'), { status: 401 });
    }
    const { data, error } = await supabase.auth.getUser(bearer);
    if (error || !data.user) {
      throw Object.assign(new Error('Invalid token'), { status: 401 });
    }
    session = { user: data.user, expires_at: 0, expires_in: 0, token_type: 'bearer', access_token: bearer };
  }

  const userId = session!.user.id;

  const { data: roles, error: roleErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (roleErr || !roles) {
    throw Object.assign(new Error('Forbidden: role not found'), { status: 403 });
  }

  const role = roles.role as UserRole;
  if (!requiredRoles.includes(role)) {
    throw Object.assign(new Error('Forbidden: insufficient role'), { status: 403 });
  }

  return { userId, role };
}

export async function assertLicenseOwnership(licenseNumber: string, userId: string) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  const { data, error } = await supabase
    .from('licenses')
    .select('id, owner_user_id')
    .eq('license_number', licenseNumber)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw Object.assign(new Error('License not found'), { status: 404 });
  }

  if (data.owner_user_id !== userId) {
    throw Object.assign(new Error('Forbidden: not license owner'), { status: 403 });
  }

  return data;
}



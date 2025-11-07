import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from './supabaseAdmin'

type AuthenticatedUserResult =
  | { user: User; accessToken: string }
  | { user: null; accessToken: null; error: string }

const UNAUTHORIZED: AuthenticatedUserResult = {
  user: null,
  accessToken: null,
  error: 'missing or invalid access token',
}

export async function getRequestUser(req: Request): Promise<AuthenticatedUserResult> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return UNAUTHORIZED
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    return {
      user: null,
      accessToken: null,
      error: error?.message || 'unauthorized',
    }
  }

  return { user: data.user, accessToken: token }
}


import { atom, computed } from 'nanostores'
import { supabase } from '../lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

// Límites de escaneos por plan
export const SCAN_LIMITS = {
  basico: 20,
  pro: 50,
} as const

export type SubscriptionTier = keyof typeof SCAN_LIMITS | null

// Estado de autenticación
export const currentUser = atom<User | null>(null)
export const currentSession = atom<Session | null>(null)
export const authLoading = atom(true)
export const authError = atom<string | null>(null)

// Perfil del usuario (datos extendidos)
export const userProfile = atom<{
  free_scans_used: number
  is_subscribed: boolean
  subscription_end: string | null
  subscription_tier: SubscriptionTier
  monthly_scans_used: number
  monthly_scans_reset_at: string | null
  is_unlimited: boolean
} | null>(null)

// Computed: ¿puede escanear gratis?
export const canScanFree = computed(userProfile, (profile) => {
  if (!profile) return false
  return profile.free_scans_used < 1
})

// Computed: ¿tiene suscripción activa?
export const isSubscribed = computed(userProfile, (profile) => {
  if (!profile) return false
  if (!profile.is_subscribed) return false
  if (profile.subscription_end) {
    return new Date(profile.subscription_end) > new Date()
  }
  return true
})

// Computed: límite de escaneos mensuales según plan
export const monthlyLimit = computed(userProfile, (profile) => {
  if (!profile?.subscription_tier) return 0
  return SCAN_LIMITS[profile.subscription_tier as keyof typeof SCAN_LIMITS] ?? 0
})

// Computed: escaneos usados este mes
export const monthlyScansUsed = computed(userProfile, (profile) => {
  return profile?.monthly_scans_used ?? 0
})

// Computed: escaneos restantes este mes
export const monthlyScansLeft = computed(userProfile, (profile) => {
  if (!profile?.subscription_tier) return 0
  const limit = SCAN_LIMITS[profile.subscription_tier as keyof typeof SCAN_LIMITS] ?? 0
  return Math.max(0, limit - (profile.monthly_scans_used ?? 0))
})

// Computed: ¿puede escanear? (ilimitado / gratis / suscrito con límite mensual)
export const canScan = computed(userProfile, (profile) => {
  if (!profile) return false
  // Usuario con acceso ilimitado (test/admin)
  if (profile.is_unlimited) return true
  // Escaneo gratuito disponible
  if (profile.free_scans_used < 1) return true
  // Sin suscripción
  if (!profile.is_subscribed) return false
  // Suscripción expirada
  if (profile.subscription_end && new Date(profile.subscription_end) <= new Date()) return false
  // Verificar límite mensual según plan
  const limit = SCAN_LIMITS[profile.subscription_tier as keyof typeof SCAN_LIMITS] ?? 0
  return profile.monthly_scans_used < limit
})

// Guard: evita que múltiples islands llamen initAuth() en paralelo
let _authInitialized = false
let _authInitializing = false

// Inicializar auth listener
export async function initAuth() {
  // Si ya está inicializado o inicializándose, no repetir
  if (_authInitialized || _authInitializing) return
  _authInitializing = true
  authLoading.set(true)

  try {
    // Timeout de seguridad: si Supabase tarda > 8s, desbloquear
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null } }), 8000)
    )
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any

    if (session) {
      currentUser.set(session.user)
      currentSession.set(session)
      await fetchUserProfile(session.user.id)
    }
  } catch (e) {
    console.error('Error initializing auth:', e)
  } finally {
    authLoading.set(false)
    _authInitialized = true
    _authInitializing = false
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser.set(session?.user ?? null)
    currentSession.set(session)
    if (session?.user) {
      await fetchUserProfile(session.user.id)
    } else {
      userProfile.set(null)
    }
  })
}

// Obtener perfil del usuario
async function fetchUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('free_scans_used, is_subscribed, subscription_end, subscription_tier, monthly_scans_used, monthly_scans_reset_at, is_unlimited')
      .eq('id', userId)
      .maybeSingle()  // null si no existe fila, sin 406

    if (error) {
      console.error('fetchUserProfile error:', error.message)
      return
    }

    if (!data) {
      // El trigger no creó el perfil (usuario registrado antes del trigger)
      // Intentar crearlo ahora
      const user = currentUser.get()
      if (user) {
        await supabase.from('user_profiles').insert({
          id: userId,
          email: user.email ?? '',
          free_scans_used: 0,
        })
        // Perfil recién creado → valores por defecto
        userProfile.set({
          free_scans_used: 0,
          is_subscribed: false,
          subscription_end: null,
          subscription_tier: null,
          monthly_scans_used: 0,
          monthly_scans_reset_at: null,
          is_unlimited: false,
        })
      }
      return
    }

    userProfile.set({
      free_scans_used: data.free_scans_used ?? 0,
      is_subscribed: data.is_subscribed ?? false,
      subscription_end: data.subscription_end ?? null,
      subscription_tier: data.subscription_tier ?? null,
      monthly_scans_used: data.monthly_scans_used ?? 0,
      monthly_scans_reset_at: data.monthly_scans_reset_at ?? null,
      is_unlimited: data.is_unlimited ?? false,
    })
  } catch (e) {
    console.error('fetchUserProfile exception:', e)
  }
}

// Registro
export async function signUp(email: string, password: string, fullName: string) {
  authError.set(null)
  authLoading.set(true)
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) {
      authError.set(error.message)
      return null
    }
    return data
  } finally {
    authLoading.set(false)
  }
}

// Login
export async function signIn(email: string, password: string) {
  authError.set(null)
  authLoading.set(true)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      authError.set(error.message)
      return null
    }
    return data
  } finally {
    authLoading.set(false)
  }
}

// Logout
export async function signOut() {
  await supabase.auth.signOut()
  currentUser.set(null)
  currentSession.set(null)
  userProfile.set(null)
}

// Incrementar contador de escaneos gratuitos
export async function incrementFreeScans(userId: string) {
  const profile = userProfile.get()
  if (!profile) return

  const { error } = await supabase
    .from('user_profiles')
    .update({ free_scans_used: profile.free_scans_used + 1 })
    .eq('id', userId)

  if (!error) {
    userProfile.set({ ...profile, free_scans_used: profile.free_scans_used + 1 })
  }
}

// Refrescar perfil
export async function refreshProfile() {
  const user = currentUser.get()
  if (user) {
    await fetchUserProfile(user.id)
  }
}

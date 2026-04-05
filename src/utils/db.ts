import { supabase } from './supabase'

// ── Types ──────────────────────────────────────────────

export interface Group {
  id: string
  name: string
  join_code: string
  created_at: string
}

export interface Submission {
  id: string
  user_id: string
  name: string
  group_id: string
  bracket: any
  created_at: string
  updated_at: string
}

// ── Group operations ───────────────────────────────────

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * Create a new group with a unique join code.
 */
export const createGroup = async (name: string): Promise<Group | null> => {
  // Try up to 5 times in case of join code collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = generateJoinCode()
    const { data, error } = await supabase
      .from('groups')
      .insert({ name, join_code: joinCode })
      .select()
      .single()

    if (error) {
      // If it's a unique constraint violation on join_code, retry
      if (error.code === '23505' && error.message.includes('join_code')) {
        continue
      }
      console.error('Error creating group:', error)
      return null
    }
    return data
  }
  console.error('Failed to generate unique join code after 5 attempts')
  return null
}

/**
 * Fetch a group by its ID.
 */
export const getGroupById = async (id: string): Promise<Group | null> => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    console.error('Error fetching group:', error)
    return null
  }
  return data
}

/**
 * Fetch a group by its join code (case-insensitive).
 */
export const getGroupByJoinCode = async (joinCode: string): Promise<Group | null> => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .ilike('join_code', joinCode.trim())
    .single()
  if (error) {
    console.error('Error fetching group by join code:', error)
    return null
  }
  return data
}

// ── Submission operations (group-scoped) ───────────────

/**
 * Fetch all submissions for a specific group.
 */
export const getSubmissions = async (groupId: string): Promise<Submission[]> => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('group_id', groupId)
  if (error) {
    console.error('Error fetching submissions:', error)
    return []
  }
  return data ?? []
}

/**
 * Fetch a single submission by id.
 */
export const getSubmission = async (id: string): Promise<Submission | null> => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    console.error('Error fetching submission:', error)
    return null
  }
  return data
}

/**
 * Upsert a submission within a group (insert or update based on group_id + name).
 */
export const upsertSubmission = async (
  groupId: string,
  name: string,
  bracket: any
): Promise<Submission | null> => {
  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      {
        user_id: name,
        group_id: groupId,
        name,
        bracket,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'group_id,name' }
    )
    .select()
    .single()
  if (error) {
    console.error('Error upserting submission:', error)
    return null
  }
  return data
}

// ── Official results (global) ──────────────────────────

/**
 * Fetch the latest official results from the database.
 */
export const getOfficialResults = async (): Promise<any | null> => {
  const { data, error } = await supabase
    .from('official_results')
    .select('results')
    .order('updated_at', { ascending: false })
    .limit(1)
  if (error) {
    console.error('Error fetching official results:', error)
    return null
  }
  if (!data || data.length === 0) {
    return {}
  }
  return data[0]?.results ?? {}
}

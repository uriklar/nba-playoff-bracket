const STORAGE_KEY = 'nba_bracket_data'

interface GroupLocalData {
  admin_secret?: string
  participant_name?: string
}

type StorageData = Record<string, GroupLocalData>

function readAll(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getGroupLocalData(groupId: string): GroupLocalData {
  return readAll()[groupId] ?? {}
}

export function setAdminSecret(groupId: string, secret: string): void {
  const data = readAll()
  data[groupId] = { ...data[groupId], admin_secret: secret }
  writeAll(data)
}

export function getAdminSecret(groupId: string): string | null {
  return getGroupLocalData(groupId).admin_secret ?? null
}

export function setParticipantName(groupId: string, name: string): void {
  const data = readAll()
  data[groupId] = { ...data[groupId], participant_name: name }
  writeAll(data)
}

export function getParticipantName(groupId: string): string | null {
  return getGroupLocalData(groupId).participant_name ?? null
}

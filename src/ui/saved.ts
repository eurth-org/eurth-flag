/** Flags saved on this device: a name and the link that draws it. Nothing leaves the browser. */
const key = 'flagwright:saved';
const LIMIT = 60;

export interface SavedFlag {
  name: string;
  /** The link's #part: the whole design. */
  hash: string;
  at: number;
}

export function savedFlags(): SavedFlag[] {
  try {
    const list = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(list) ? list.filter((f) => f && typeof f.hash === 'string' && typeof f.name === 'string').slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

function store(list: SavedFlag[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(list.slice(0, LIMIT)));
    return true;
  } catch {
    return false;
  }
}

/** Saves a flag, newest first. A flag saved twice is kept once. */
export function saveFlag(name: string, hash: string): SavedFlag[] | null {
  const list = [{ name, hash, at: Date.now() }, ...savedFlags().filter((f) => f.hash !== hash)];
  return store(list) ? list.slice(0, LIMIT) : null;
}

export function forgetFlag(hash: string): SavedFlag[] {
  const list = savedFlags().filter((f) => f.hash !== hash);
  store(list);
  return list;
}

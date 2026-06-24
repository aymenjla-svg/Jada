// Couche de données. Une seule interface, deux moteurs :
//  - LocalStore     : données dans le navigateur (mode sans synchro).
//  - SupabaseStore  : base partagée + temps réel (synchro entre les 2 tél.).
//
// Collections : child, events, measurements, vaccines, appointments, medical_entries

import { CONFIG, SYNC_ENABLED } from "./config.js";

const COLLECTIONS = ["events", "measurements", "vaccines", "appointments", "medical_entries"];

// ----------------------------------------------------------------
//  Émetteur de changements (déclenche un re-render)
// ----------------------------------------------------------------
class Emitter {
  constructor() { this._cbs = new Set(); }
  onChange(cb) { this._cbs.add(cb); return () => this._cbs.delete(cb); }
  _emit() { this._cbs.forEach((cb) => cb()); }
}

// ----------------------------------------------------------------
//  Mode local (localStorage)
// ----------------------------------------------------------------
class LocalStore extends Emitter {
  constructor() { super(); this.mode = "local"; }
  async init() {
    addEventListener("storage", (e) => { if (e.key?.startsWith("jada:")) this._emit(); });
  }
  _key(c) { return "jada:" + c; }
  _read(c) { try { return JSON.parse(localStorage.getItem(this._key(c))) || []; } catch { return []; } }
  _write(c, v) { localStorage.setItem(this._key(c), JSON.stringify(v)); this._emit(); }

  async getChild() { try { return JSON.parse(localStorage.getItem("jada:child")); } catch { return null; } }
  async setChild(obj) { localStorage.setItem("jada:child", JSON.stringify(obj)); this._emit(); }

  async list(c) { return this._read(c); }
  async insert(c, obj) { const a = this._read(c); a.push(obj); this._write(c, a); return obj; }
  async insertMany(c, objs) { const a = this._read(c); a.push(...objs); this._write(c, a); }
  async update(c, id, patch) {
    const a = this._read(c); const i = a.findIndex((x) => x.id === id);
    if (i >= 0) { a[i] = { ...a[i], ...patch }; this._write(c, a); }
  }
  async remove(c, id) { this._write(c, this._read(c).filter((x) => x.id !== id)); }
}

// ----------------------------------------------------------------
//  Mode synchro (Supabase + Realtime)
// ----------------------------------------------------------------
class SupabaseStore extends Emitter {
  constructor(client) { super(); this.sb = client; this.mode = "cloud"; }
  async init() {
    const ch = this.sb.channel("jada-realtime");
    for (const c of [...COLLECTIONS, "children"]) {
      ch.on("postgres_changes", { event: "*", schema: "public", table: c }, () => this._emit());
    }
    ch.subscribe();
  }

  async getChild() {
    const { data } = await this.sb.from("children").select("*").limit(1).maybeSingle();
    return data || null;
  }
  async setChild(obj) {
    await this.sb.from("children").upsert(obj);
    this._emit();
  }

  async list(c) {
    const { data } = await this.sb.from(c).select("*");
    return data || [];
  }
  async insert(c, obj) { await this.sb.from(c).insert(obj); return obj; }
  async insertMany(c, objs) { if (objs.length) await this.sb.from(c).insert(objs); }
  async update(c, id, patch) { await this.sb.from(c).update(patch).eq("id", id); }
  async remove(c, id) { await this.sb.from(c).delete().eq("id", id); }
}

// ----------------------------------------------------------------
//  Fabrique
// ----------------------------------------------------------------
let _supabaseClient = null;

export async function getSupabaseClient() {
  if (!SYNC_ENABLED) return null;
  if (_supabaseClient) return _supabaseClient;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  _supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  return _supabaseClient;
}

export async function createStore() {
  if (SYNC_ENABLED) {
    const client = await getSupabaseClient();
    const store = new SupabaseStore(client);
    await store.init();
    return store;
  }
  const store = new LocalStore();
  await store.init();
  return store;
}

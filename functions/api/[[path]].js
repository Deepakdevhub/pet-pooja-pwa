/**
 * ═══════════════════════════════════════════════════════════
 * PET POOJA — API (Cloudflare Pages Function)
 * ═══════════════════════════════════════════════════════════
 * Single catch-all handler for all /api/* routes.
 * Uses D1 database, JWT auth, SHA-256 code verification.
 */

// ── JWT helpers (using Web Crypto API) ──────────────────
const JWT_ALG = { name: 'HMAC', hash: 'SHA-256' };
const ENC = new TextEncoder();

async function importKey(secret) {
  return crypto.subtle.importKey('raw', ENC.encode(secret), JWT_ALG, false, ['sign', 'verify']);
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function signJWT(payload, secret) {
  const key = await importKey(secret);
  const header = b64url(ENC.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(ENC.encode(JSON.stringify(payload)));
  const sig = b64url(await crypto.subtle.sign('HMAC', key, ENC.encode(`${header}.${body}`)));
  return `${header}.${body}.${sig}`;
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    const key = await importKey(secret);
    const valid = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), ENC.encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch { return null; }
}

async function sha256(str) {
  const hash = await crypto.subtle.digest('SHA-256', ENC.encode(str));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Response helpers ────────────────────────────────────
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
});
const err = (msg, status = 400) => json({ error: msg }, status);

// ── Snake_case → camelCase mapper ───────────────────────
function camel(obj) {
  if (Array.isArray(obj)) return obj.map(camel);
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[ck] = v;
  }
  return out;
}

// ── Main handler ────────────────────────────────────────
export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = '/' + (params.path?.join('/') || '');
  const DB = env.DB;
  const JWT_SECRET = env.JWT_SECRET || 'dev-secret-change-me';

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
    });
  }

  // Parse body for POST/PUT
  let body = null;
  if (method === 'POST' || method === 'PUT') {
    try { body = await request.json(); } catch { body = {}; }
  }

  // Auth middleware — extract JWT
  let user = null;
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    user = await verifyJWT(authHeader.slice(7), JWT_SECRET);
  }

  // Helper: require auth
  const requireAuth = () => { if (!user) throw { status: 401, msg: 'Unauthorized' }; };
  const requireAdmin = () => { if (!user || user.role !== 'admin') throw { status: 403, msg: 'Admin required' }; };

  try {
    // ══════════════════════════════════════════════════════
    // AUTH ROUTES
    // ══════════════════════════════════════════════════════
    if (path === '/auth/customer' && method === 'POST') {
      const { name, mobile, code } = body;
      if (!name || !mobile || !code) return err('Missing name, mobile, or code');

      const codeHash = await sha256(code);
      const expected = env.CUSTOMER_CODE_HASH;
      if (codeHash !== expected) return err('Invalid code', 401);

      // Upsert user
      await DB.prepare(
        `INSERT INTO users (mobile, name, created_at, last_seen) VALUES (?1, ?2, datetime('now'), datetime('now'))
         ON CONFLICT(mobile) DO UPDATE SET name = ?2, last_seen = datetime('now')`
      ).bind(mobile, name).run();

      const token = await signJWT({
        mobile, name, role: 'customer', exp: Math.floor(Date.now() / 1000) + 7 * 86400,
      }, JWT_SECRET);

      // Log
      await logToDB(DB, 'info', 'Customer login', JSON.stringify({ name, mobile }));
      return json({ token, user: { name, mobile } });
    }

    if (path === '/auth/admin' && method === 'POST') {
      const { code } = body;
      if (!code) return err('Missing code');

      const codeHash = await sha256(code);
      const expected = env.ADMIN_CODE_HASH;
      if (codeHash !== expected) return err('Invalid admin code', 401);

      const token = await signJWT({
        role: 'admin', exp: Math.floor(Date.now() / 1000) + 7 * 86400,
      }, JWT_SECRET);

      await logToDB(DB, 'info', 'Admin login successful');
      return json({ token });
    }

    // ══════════════════════════════════════════════════════
    // MENU ROUTES
    // ══════════════════════════════════════════════════════
    if (path === '/menu' && method === 'GET') {
      const { results } = await DB.prepare(
        'SELECT * FROM menu_items ORDER BY category, sort_order'
      ).all();
      // Parse tags JSON
      const items = results.map(r => ({
        ...camel(r), available: !!r.available, tags: r.tags ? JSON.parse(r.tags) : [],
      }));
      return json(items);
    }

    if (path === '/menu' && method === 'POST') {
      requireAdmin();
      const { name, price, category, description, tags, badge, img } = body;
      const id = `custom_${Date.now()}`;
      const maxOrder = await DB.prepare('SELECT MAX(sort_order) as m FROM menu_items WHERE category=?1').bind(category).first();
      await DB.prepare(
        `INSERT INTO menu_items (id,name,price,category,available,description,tags,badge,img,sort_order)
         VALUES (?1,?2,?3,?4,1,?5,?6,?7,?8,?9)`
      ).bind(id, name, price, category, description || null, JSON.stringify(tags || []), badge || null, img || null, (maxOrder?.m || 0) + 1).run();
      await logToDB(DB, 'info', 'Menu item added', JSON.stringify({ name }));
      return json({ id, name, price, category, available: true, description, tags: tags || [], badge, img });
    }

    if (path.startsWith('/menu/') && method === 'PUT') {
      requireAdmin();
      const id = path.split('/')[2];
      const fields = []; const vals = [];
      for (const [k, v] of Object.entries(body)) {
        if (k === 'id') continue;
        const col = k === 'description' ? 'description' : k === 'tags' ? 'tags' : k === 'available' ? 'available' : k;
        if (k === 'tags') { fields.push(`${col}=?`); vals.push(JSON.stringify(v)); }
        else if (k === 'available') { fields.push(`${col}=?`); vals.push(v ? 1 : 0); }
        else { fields.push(`${col}=?`); vals.push(v); }
      }
      if (fields.length === 0) return err('No fields to update');
      vals.push(id);
      await DB.prepare(`UPDATE menu_items SET ${fields.join(',')} WHERE id=?`).bind(...vals).run();
      return json({ ok: true });
    }

    if (path.startsWith('/menu/') && method === 'DELETE') {
      requireAdmin();
      const id = path.split('/')[2];
      await DB.prepare('DELETE FROM menu_items WHERE id=?1').bind(id).run();
      await logToDB(DB, 'info', 'Menu item deleted', JSON.stringify({ id }));
      return json({ ok: true });
    }

    // ══════════════════════════════════════════════════════
    // ORDER ROUTES
    // ══════════════════════════════════════════════════════
    if (path === '/orders' && method === 'GET') {
      requireAuth();
      let results;
      if (user.role === 'admin') {
        ({ results } = await DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all());
      } else {
        ({ results } = await DB.prepare('SELECT * FROM orders WHERE user_mobile=?1 ORDER BY created_at DESC LIMIT 50').bind(user.mobile).all());
      }
      const orders = results.map(r => ({
        ...camel(r), items: JSON.parse(r.items), extras: r.extras ? JSON.parse(r.extras) : [],
        cutlery: !!r.cutlery,
        customer: { name: r.user_name, mobile: r.user_mobile },
      }));
      return json(orders);
    }

    if (path === '/orders' && method === 'POST') {
      requireAuth();
      const { items, extras, notes, coupon, cutlery, discount, mode } = body;
      if (!items?.length) return err('Empty order');

      // Generate order number
      const today = new Date().toISOString().slice(0, 10);
      const dateStr = today.replace(/-/g, '');
      const countRes = await DB.prepare(
        "SELECT COUNT(*) as c FROM orders WHERE created_at >= ?1"
      ).bind(today).first();
      const seq = String((countRes?.c || 0) + 1).padStart(3, '0');
      const orderNum = `PP${dateStr}-${seq}`;
      const id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const extrasTotal = (extras || []).reduce((s, e) => s + e.price, 0);
      const total = subtotal + extrasTotal - (discount || 0);

      await DB.prepare(
        `INSERT INTO orders (id,order_num,user_mobile,user_name,items,extras,notes,coupon,subtotal,extras_total,discount,total,status,mode,cutlery,created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,'active',?13,?14,datetime('now'))`
      ).bind(id, orderNum, user.mobile, user.name, JSON.stringify(items), JSON.stringify(extras || []),
        notes || null, coupon || null, subtotal, extrasTotal, discount || 0, total, mode || 'online', cutlery ? 1 : 0).run();

      // Cash entry
      const cashId = `cash_${Date.now()}`;
      await DB.prepare(
        `INSERT INTO cash_entries (id,type,amount,note,created_at) VALUES (?1,'in',?2,?3,datetime('now'))`
      ).bind(cashId, total, `Order #${orderNum}`).run();

      await logToDB(DB, 'info', 'Order placed', JSON.stringify({ orderNum, total }));

      return json({
        id, orderNum, customer: { name: user.name, mobile: user.mobile },
        items, extras: extras || [], notes, coupon, subtotal, extrasTotal,
        discount: discount || 0, total, status: 'active', mode: mode || 'online',
        cutlery: !!cutlery, createdAt: new Date().toISOString(),
      });
    }

    if (path.startsWith('/orders/') && method === 'PUT') {
      requireAdmin();
      const id = path.split('/')[2];
      const { status, cancelReason, items } = body;

      if (status === 'fulfilled') {
        await DB.prepare("UPDATE orders SET status='fulfilled', fulfilled_at=datetime('now') WHERE id=?1").bind(id).run();
        await logToDB(DB, 'info', 'Order fulfilled', JSON.stringify({ id }));
      } else if (status === 'cancelled') {
        const order = await DB.prepare('SELECT total, order_num FROM orders WHERE id=?1').bind(id).first();
        await DB.prepare("UPDATE orders SET status='cancelled', cancelled_at=datetime('now'), cancel_reason=?2 WHERE id=?1").bind(id, cancelReason || '').run();
        if (order) {
          const cashId = `cash_${Date.now()}`;
          await DB.prepare(`INSERT INTO cash_entries (id,type,amount,note,created_at) VALUES (?1,'out',?2,?3,datetime('now'))`)
            .bind(cashId, order.total, `Cancelled #${order.order_num}`).run();
        }
        await logToDB(DB, 'info', 'Order cancelled', JSON.stringify({ id }));
      } else if (items) {
        // Edit items
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
        const order = await DB.prepare('SELECT extras_total, discount, total, order_num FROM orders WHERE id=?1').bind(id).first();
        const newTotal = subtotal + (order?.extras_total || 0) - (order?.discount || 0);
        await DB.prepare('UPDATE orders SET items=?2, subtotal=?3, total=?4 WHERE id=?1')
          .bind(id, JSON.stringify(items), subtotal, newTotal).run();
        const diff = newTotal - (order?.total || 0);
        if (diff !== 0) {
          const cashId = `cash_${Date.now()}`;
          await DB.prepare(`INSERT INTO cash_entries (id,type,amount,note,created_at) VALUES (?1,?2,?3,?4,datetime('now'))`)
            .bind(cashId, diff > 0 ? 'in' : 'out', Math.abs(diff), `Edited #${order?.order_num}`).run();
        }
      }
      return json({ ok: true });
    }

    // ══════════════════════════════════════════════════════
    // CUSTOMERS
    // ══════════════════════════════════════════════════════
    if (path === '/customers' && method === 'GET') {
      requireAdmin();
      const { results } = await DB.prepare('SELECT * FROM users ORDER BY last_seen DESC').all();
      return json(results.map(r => ({
        ...camel(r), firstSeen: r.created_at, lastSeen: r.last_seen,
        orderCount: 0, totalSpent: 0,
      })));
    }

    // ══════════════════════════════════════════════════════
    // CASH
    // ══════════════════════════════════════════════════════
    if (path === '/cash' && method === 'GET') {
      requireAdmin();
      const { results } = await DB.prepare('SELECT * FROM cash_entries ORDER BY created_at DESC LIMIT 500').all();
      return json(camel(results));
    }

    if (path === '/cash' && method === 'POST') {
      requireAdmin();
      const { type, amount, note } = body;
      const id = `cash_${Date.now()}`;
      await DB.prepare(`INSERT INTO cash_entries (id,type,amount,note,created_at) VALUES (?1,?2,?3,?4,datetime('now'))`)
        .bind(id, type, amount, note || '').run();
      return json({ id, type, amount, note, createdAt: new Date().toISOString() });
    }

    // ══════════════════════════════════════════════════════
    // SETTINGS
    // ══════════════════════════════════════════════════════
    if (path === '/settings' && method === 'GET') {
      const { results } = await DB.prepare('SELECT * FROM settings').all();
      const settings = {};
      for (const r of results) settings[r.key] = r.value === 'true' ? true : r.value === 'false' ? false : r.value;
      return json(settings);
    }

    if (path === '/settings' && method === 'PUT') {
      requireAdmin();
      for (const [k, v] of Object.entries(body)) {
        await DB.prepare('INSERT INTO settings (key,value) VALUES (?1,?2) ON CONFLICT(key) DO UPDATE SET value=?2').bind(k, String(v)).run();
      }
      return json({ ok: true });
    }

    // ══════════════════════════════════════════════════════
    // LOGS
    // ══════════════════════════════════════════════════════
    if (path === '/logs' && method === 'GET') {
      requireAdmin();
      const { results } = await DB.prepare('SELECT * FROM app_logs ORDER BY created_at DESC LIMIT 500').all();
      return json(results.map(r => ({ ...camel(r), details: r.details ? JSON.parse(r.details) : null })));
    }

    if (path === '/logs' && method === 'DELETE') {
      requireAdmin();
      await DB.prepare('DELETE FROM app_logs').run();
      return json({ ok: true });
    }

    // ── 404 ──
    return err('Not found', 404);

  } catch (e) {
    if (e.status) return err(e.msg, e.status);
    console.error('API Error:', e);
    await logToDB(DB, 'error', e.message || 'Unknown error', JSON.stringify({ stack: e.stack }));
    return err('Internal server error', 500);
  }
}

// ── Log helper ──────────────────────────────────────────
async function logToDB(DB, level, message, details = null) {
  try {
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    await DB.prepare(`INSERT INTO app_logs (id,level,message,details,created_at) VALUES (?1,?2,?3,?4,datetime('now'))`)
      .bind(id, level, message, details).run();
  } catch { /* fire and forget */ }
}

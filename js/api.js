const API_URL = 'https://script.google.com/macros/s/AKfycbwlXsfOzHtXYSkQWeWPHRqx523TwplWugftV36teujhuS-bAOtY9HDKVYswdqbRW3T1Ug/exec';

export function jsonp(params = {}) {
  return new Promise((resolve, reject) => {
    const callback = '__attendify_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    const query = new URLSearchParams({ ...params, callback });
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
    };
    const fail = (message) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };
    const timer = setTimeout(() => fail('Server tidak merespons.'), 12000);

    window[callback] = (data) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (data && data.success === false) reject(new Error(data.message || 'Permintaan gagal.'));
      else resolve(data);
    };
    script.onerror = () => fail('Gagal terhubung ke Google Sheets.');
    script.src = API_URL + '?' + query.toString();
    document.body.appendChild(script);
  });
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[char]));
}

export function todayJakarta() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

export function formatDateId(value) {
  if (!value) return '-';
  const parts = String(value).split('-');
  if (parts.length !== 3) return value;
  return parts.reverse().join('/');
}

export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

export function toast(message, type = 'info') {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const item = document.createElement('div');
  item.className = 'toast ' + type;
  item.textContent = message;
  host.appendChild(item);
  setTimeout(() => item.remove(), 3600);
}

export function initTheme() {
  const saved = localStorage.getItem('attendify_theme');
  if (saved === 'dark') document.documentElement.dataset.theme = 'dark';
  const button = document.getElementById('theme-toggle');
  if (button) {
    button.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '◐';
    button.onclick = () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      document.documentElement.dataset.theme = dark ? 'dark' : '';
      localStorage.setItem('attendify_theme', dark ? 'dark' : 'light');
      button.textContent = dark ? '☀️' : '◐';
    };
  }
}

export function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) toggle.onclick = () => nav.classList.toggle('open');
}

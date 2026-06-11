import 'server-only';

// Lightweight Resend client via REST (no SDK dependency).
// No-ops safely when RESEND_API_KEY is unset, so the app works before email
// is configured. Never throws into callers — email failure must not block
// moderation actions.

const FROM = process.env.EMAIL_FROM ?? 'Maarifa <onboarding@resend.dev>';

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email] RESEND_API_KEY not set — skipped email "${opts.subject}" to ${opts.to}`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      console.error('[email] Resend responded', res.status, await res.text());
    }
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}

function shell(title: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1A1A1A">
    <h2 style="color:#0F4C81;margin:0 0 12px">${title}</h2>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
    <p style="font-size:12px;color:#6B7280">Maarifa — Archives Académiques du Sud-Kivu</p>
  </div>`;
}

const btn = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#0F4C81;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600">${label}</a>`;

export function emailPublicationApproved(p: { fullName: string; title: string; url: string }) {
  return {
    subject: `Votre publication est en ligne : ${p.title}`,
    html: shell(
      'Votre publication a été approuvée 🎉',
      `<p>Bonjour ${escape(p.fullName)},</p>
       <p>Votre travail <strong>${escape(p.title)}</strong> a été approuvé et est maintenant publié sur Maarifa.</p>
       <p style="margin:20px 0">${btn(p.url, 'Voir ma publication')}</p>
       <p style="font-size:13px;color:#6B7280">Partagez-le sur WhatsApp pour le faire découvrir.</p>`,
    ),
  };
}

export function emailNewPendingPublication(p: {
  title: string;
  authorName: string;
  moderationUrl: string;
}) {
  return {
    subject: `Nouvelle publication à modérer : ${p.title}`,
    html: shell(
      'Nouvelle soumission en attente',
      `<p>Une nouvelle publication attend votre modération :</p>
       <p><strong>${escape(p.title)}</strong><br/>${escape(p.authorName)}</p>
       <p style="margin:20px 0">${btn(p.moderationUrl, 'Examiner la file de modération')}</p>`,
    ),
  };
}

export function emailPublicationRejected(p: { fullName: string; title: string; reason: string }) {
  return {
    subject: `Votre publication nécessite des modifications : ${p.title}`,
    html: shell(
      'Votre publication n’a pas été approuvée',
      `<p>Bonjour ${escape(p.fullName)},</p>
       <p>Votre travail <strong>${escape(p.title)}</strong> n’a pas pu être publié pour le motif suivant :</p>
       <blockquote style="border-left:3px solid #C0392B;margin:12px 0;padding:8px 12px;color:#444;background:#faf2f1">${escape(p.reason)}</blockquote>
       <p>Vous pouvez corriger et soumettre à nouveau depuis votre espace.</p>`,
    ),
  };
}

// Minimal HTML escaping for interpolated user content.
function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

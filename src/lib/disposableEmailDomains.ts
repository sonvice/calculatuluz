// Dominios de email desechables más comunes (mailinator, guerrilla, etc.)
export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamailblock.com', 'sharklasers.com', 'spam4.me',
  'trashmail.com', 'trashmail.me', 'trashmail.net', 'trashmail.at',
  'trashmail.io', 'trashmail.org', 'yopmail.com', 'yopmail.fr',
  'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx',
  'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf', 'moncourrier.fr.nf',
  'monemail.fr.nf', 'monmail.fr.nf', 'tempr.email', 'discard.email',
  'discardmail.com', 'discardmail.de', 'spamgourmet.com', 'spamgourmet.net',
  'spamgourmet.org', 'throwam.com', 'throwaway.email', 'temp-mail.org',
  'tempmail.com', 'tempmail.net', 'tempmail.de', 'fakeinbox.com',
  'mailnull.com', 'mailnull.net', 'spamfree24.org', 'bugmenot.com',
  'maildrop.cc', 'getairmail.com', 'mailbucket.org', 'spamhere.eu',
  'spamhole.com', 'spami.com', 'spam.la', 'bspamfree.org',
  'nospamfor.us', 'spaml.com', 'spamtrail.com', 'trbvm.com',
  'trb.in', 'spamthisplease.com', 'spaminator.de', 'throwam.com',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  '20minutemail.com', 'minutemailbox.com', 'emailondeck.com',
  'dispostable.com', 'inboxalias.com', 'mailnesia.com',
  'mytrashmail.com', 'sogetthis.com', 'shitmail.me',
  'mt2009.com', 'klzlk.com', 'spamokay.com', 'dontreg.com',
])

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return true
  return DISPOSABLE_DOMAINS.has(domain)
}

// Validación básica de formato de email
export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

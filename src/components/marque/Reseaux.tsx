/** Pictogrammes des réseaux sociaux (absents de la bibliothèque d'icônes). */
export function IconeInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconeFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3Z" />
    </svg>
  );
}

export function IconeTiktok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v2.9c-1.4.1-2.6-.3-3.9-1.1v5.6c0 6.6-7.2 8.7-10.1 4-1.9-3-.7-8.3 5.4-8.5v3c-.5.1-1 .2-1.4.4-1.4.5-2.2 1.4-2 3 .4 3 5.9 3.9 5.5-2V3h2.6Z" />
    </svg>
  );
}

export function IconeSnapchat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.5c3.2 0 5.3 2.5 5.3 5.4v2.3c.5.2 1.1 0 1.6-.2.6-.2 1.2.5.7 1-.5.4-1.4.7-2 .9-.3.1-.4.4-.3.7.7 1.6 2 2.9 3.6 3.4.4.1.4.6.1.8-.6.4-1.5.5-2.1.7-.3.1-.3.7-.6.9-.5.3-1.4 0-2.2.2-1 .3-1.8 1.5-4.1 1.5s-3.1-1.2-4.1-1.5c-.8-.2-1.7.1-2.2-.2-.3-.2-.3-.8-.6-.9-.6-.2-1.5-.3-2.1-.7-.3-.2-.3-.7.1-.8 1.6-.5 2.9-1.8 3.6-3.4.1-.3 0-.6-.3-.7-.6-.2-1.5-.5-2-.9-.5-.5.1-1.2.7-1 .5.2 1.1.4 1.6.2V7.9c0-2.9 2.1-5.4 5.3-5.4Z" />
    </svg>
  );
}

import type { SVGProps } from "react";

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    passport: <><path d="M6.5 3.5h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><circle cx="12" cy="10" r="3"/><path d="M9.2 9h5.6M9.2 11h5.6M12 7c1 1.8 1 4.2 0 6M12 7c-1 1.8-1 4.2 0 6M8 16.5h8"/></>,
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/></>,
    check: <path d="m5 12.5 4 4L19 7"/>,
    sparkle: <><path d="M12 2.8c.6 4.3 2.9 6.6 7.2 7.2-4.3.6-6.6 2.9-7.2 7.2-.6-4.3-2.9-6.6-7.2-7.2 4.3-.6 6.6-2.9 7.2-7.2Z"/><path d="M19 16.5c.2 1.5 1 2.3 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.2 2.3-1 2.5-2.5Z"/></>,
    thumbsUp: <path d="M7 20H4V9h3m0 11h9.2c1 0 1.9-.7 2.1-1.7l1.5-7A2 2 0 0 0 17.9 9H14l.7-3.5A2.5 2.5 0 0 0 12.2 3L7 9v11Z"/>,
    thumbsDown: <path d="M7 4H4v11h3M7 4h9.2c1 0 1.9.7 2.1 1.7l1.5 7a2 2 0 0 1-1.9 2.3H14l.7 3.5a2.5 2.5 0 0 1-2.5 2.5L7 15V4Z"/>,
    shield: <><path d="M12 2.8 20 6v5.8c0 4.4-3.1 7.8-8 9.4-4.9-1.6-8-5-8-9.4V6l8-3.2Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></>,
    sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    undo: <><path d="M8 7H3v-5"/><path d="M3.5 7a9 9 0 1 1 .8 11"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}


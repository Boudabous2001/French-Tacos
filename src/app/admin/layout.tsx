import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Back-office", template: "%s · Back-office French Tacos" },
  robots: { index: false, follow: false },
  manifest: undefined,
};

export const viewport: Viewport = { themeColor: "#0b0604" };

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-nuit-950 text-creme [color-scheme:dark]">{children}</div>;
}

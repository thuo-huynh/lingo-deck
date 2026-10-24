import { ViewTransition } from "react";

/**
 * Re-mounts on every navigation, so the page content can animate in and out (a layout never would).
 * Direction comes from the link: nav-forward slides in from the right, nav-back slides back, nav-tab crossfades.
 * Navigations without a type (redirects, refresh, browser back) don't animate.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const types = { "nav-forward": "nav-forward", "nav-back": "nav-back", "nav-tab": "nav-tab", default: "none" };
  return (
    <ViewTransition enter={types} exit={types} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

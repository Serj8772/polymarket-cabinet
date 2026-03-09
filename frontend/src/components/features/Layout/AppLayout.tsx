/** Main application layout with top navigation */

import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <div
          className="page-content"
          style={{
            maxWidth: "var(--max-w)",
            margin: "0 auto",
            padding: "28px 32px 64px",
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}

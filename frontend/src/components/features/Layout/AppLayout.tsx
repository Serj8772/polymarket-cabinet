/** Main application layout with top navigation */

import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <div
          className="page-content mx-auto px-8 pt-7 pb-16"
          style={{ maxWidth: "var(--max-w)" }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}

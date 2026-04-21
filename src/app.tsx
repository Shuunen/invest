import { Link, Outlet } from "@tanstack/react-router";

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="navbar sticky top-0 z-50 border-b border-base-200 bg-base-100 shadow-sm">
        <div className="navbar-start">
          <Link to="/" className="text-xl font-bold tracking-tight">
            📈 Invest
          </Link>
        </div>
        <div className="navbar-end">
          <ul className="menu menu-horizontal gap-1 px-1">
            <li>
              <Link to="/" activeProps={{ className: "active" }}>
                Table
              </Link>
            </li>
            <li>
              <Link to="/about" activeProps={{ className: "active" }}>
                About
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

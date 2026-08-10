import { Link, useRouterState } from "@tanstack/react-router";

import { coreItems } from "@/components/app-sidebar";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {coreItems.map((item) => {
          const active = pathname === item.url;
          return (
            <li key={item.url}>
              <Link
                to={item.url}
                aria-label={item.title}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="size-5" />
                <span className="truncate px-1">{item.title.split(" ").pop()}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { App } from "./app.tsx";
import { IndexPage } from "./components/index-page.tsx";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  component: IndexPage,
  getParentRoute: () => rootRoute,
  path: "/",
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

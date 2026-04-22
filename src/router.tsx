import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { App } from "./app.tsx";
import { AboutPage } from "./components/about-page.tsx";
import { IndexPage } from "./components/index-page.tsx";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  component: IndexPage,
  getParentRoute: () => rootRoute,
  path: "/",
});

const aboutRoute = createRoute({
  component: AboutPage,
  getParentRoute: () => rootRoute,
  path: "/about",
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

export const router = createRouter({ routeTree });

import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { App } from "./app.tsx";
import { AboutPage } from "./components/about-page.tsx";
import { IndexPage } from "./components/index-page.tsx";
import { PortfolioPage } from "./components/portfolio-page.tsx";

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

const portfolioRoute = createRoute({
  component: () => {
    const { id } = portfolioRoute.useParams();
    return <PortfolioPage portfolioId={id} />;
  },
  getParentRoute: () => rootRoute,
  path: "/portfolios/$id",
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, portfolioRoute]);

export const router = createRouter({ routeTree });

import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { App } from "./app.tsx";
import { AboutPage } from "./pages/about.tsx";
import { IndexPage } from "./pages/assets.tsx";
import { AssetCreatePage } from "./pages/create.tsx";
import { AssetEditPage } from "./pages/edit.tsx";
import { PortfolioPage } from "./pages/portfolio.tsx";
import { AssetViewPage } from "./pages/view.tsx";

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

const assetCreateRoute = createRoute({
  component: AssetCreatePage,
  getParentRoute: () => rootRoute,
  path: "/assets/create",
});

const assetRoute = createRoute({
  component: () => {
    const { isin } = assetRoute.useParams();
    return <AssetViewPage isin={isin} />;
  },
  getParentRoute: () => rootRoute,
  path: "/assets/$isin",
});

const assetEditRoute = createRoute({
  component: () => {
    const { isin } = assetEditRoute.useParams();
    return <AssetEditPage isin={isin} />;
  },
  getParentRoute: () => rootRoute,
  path: "/assets/$isin/edit",
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, portfolioRoute, assetCreateRoute, assetRoute, assetEditRoute]);

export const router = createRouter({ routeTree });

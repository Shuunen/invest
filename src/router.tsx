import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { App } from "./app.tsx";
import { AboutPage } from "./components/about-page.tsx";
import { AssetEditPage } from "./components/asset-edit-page.tsx";
import { AssetViewPage } from "./components/asset-view-page.tsx";
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

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute, portfolioRoute, assetRoute, assetEditRoute]);

export const router = createRouter({ routeTree });

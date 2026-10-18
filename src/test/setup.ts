import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

// happy-dom >= 20.12 implements Element.animate(), which makes framer-motion use real animations whose cancellation rejects unhandled; hide it to keep the previous behavior
// @ts-expect-error -- deliberately removing animate
Element.prototype.animate = undefined;

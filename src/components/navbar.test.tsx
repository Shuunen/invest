import { render, screen } from "@testing-library/react";
import type { AppData } from "../schemas/index.ts";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { Navbar } from "./navbar.tsx";

const mockLink = vi.hoisted(
  () =>
    ({ children }: { children: React.ReactNode }): React.ReactElement =>
      children as React.ReactElement,
);

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, Link: mockLink as unknown as typeof actual.Link };
});

describe("Navbar", () => {
  it("renders navigation links", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<Navbar onCreatePortfolio={vi.fn<() => void>()} />);

    expect(screen.getByTestId("navbar-link-assets")).toHaveTextContent("Assets");
    expect(screen.getByTestId("navbar-link-about")).toHaveTextContent("About");
  });

  it("renders portfolio links", () => {
    expect.hasAssertions();
    const testData: AppData = {
      ...defaultAppData,
      portfolios: [
        { ...defaultAppData.portfolios[0], id: "1", name: "Test Portfolio" },
        { ...defaultAppData.portfolios[0], id: "2", name: "Another Portfolio" },
      ],
    };

    useAppStore.setState({
      data: testData,
      isLoading: false,
      loadError: undefined,
    });

    render(<Navbar onCreatePortfolio={vi.fn<() => void>()} />);

    expect(screen.getByTestId("navbar-link-1")).toHaveTextContent("Test Portfolio");
    expect(screen.getByTestId("navbar-link-2")).toHaveTextContent("Another Portfolio");
  });

  it("calls onCreatePortfolio when button is clicked", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });

    const onCreatePortfolio = vi.fn<() => void>();
    render(<Navbar onCreatePortfolio={onCreatePortfolio} />);

    const button = screen.getByTestId("navbar-create-portfolio");
    button.click();

    expect(onCreatePortfolio).toHaveBeenCalledOnce();
  });

  it("renders logo link", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });

    render(<Navbar onCreatePortfolio={vi.fn<() => void>()} />);

    const logo = screen.getByTestId("logo");
    expect(logo).toBeInTheDocument();
  });
});

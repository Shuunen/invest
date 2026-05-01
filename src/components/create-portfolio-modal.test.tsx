import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invariant } from "es-toolkit";
import { defaultAppData, useAppStore } from "../store/use-app-store.ts";
import { CreatePortfolioModal } from "./create-portfolio-modal.tsx";

const mockNavigate = vi.fn<() => Promise<void>>();

vi.mock(import("@tanstack/react-router"), async () => {
  const actual = await import("@tanstack/react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("CreatePortfolioModal", () => {
  it("renders name and broker fields", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<CreatePortfolioModal onClose={vi.fn<() => void>()} />);
    expect(screen.getByTestId("portfolio-name")).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-broker")).toBeInTheDocument();
  });

  it("shows validation error when submitting with empty name", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<CreatePortfolioModal onClose={vi.fn<() => void>()} />);
    fireEvent.click(screen.getByTestId("confirm-button"));
    await expect(screen.findByTestId("portfolio-name-error")).resolves.toBeInTheDocument();
  });

  it("shows validation error when submitting with empty broker", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<CreatePortfolioModal onClose={vi.fn<() => void>()} />);
    await userEvent.type(screen.getByTestId("portfolio-name"), "My Fund");
    fireEvent.click(screen.getByTestId("confirm-button"));
    await expect(screen.findByTestId("portfolio-broker-error")).resolves.toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const onClose = vi.fn<() => void>();
    render(<CreatePortfolioModal onClose={onClose} />);
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when X button is clicked", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const onClose = vi.fn<() => void>();
    render(<CreatePortfolioModal onClose={onClose} />);
    fireEvent.click(screen.getByTestId("modal-close-button"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const onClose = vi.fn<() => void>();
    const { container } = render(<CreatePortfolioModal onClose={onClose} />);
    const backdrop = container.querySelector(".modal-backdrop");
    expect(backdrop).not.toBeNull();
    invariant(backdrop, "Expected backdrop element to exist");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("submitting valid form adds portfolio and navigates", async () => {
    expect.hasAssertions();
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const onClose = vi.fn<() => void>();
    render(<CreatePortfolioModal onClose={onClose} />);
    await userEvent.type(screen.getByTestId("portfolio-name"), "My Fund");
    await userEvent.type(screen.getByTestId("portfolio-broker"), "Degiro");
    fireEvent.click(screen.getByTestId("confirm-button"));
    expect(useAppStore.getState().data.portfolios).toHaveLength(1);
    expect(useAppStore.getState().data.portfolios[0]?.name).toBe("My Fund");
    expect(useAppStore.getState().data.portfolios[0]?.broker).toBe("Degiro");
    expect(onClose).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/portfolios/$id" }));
  });
});

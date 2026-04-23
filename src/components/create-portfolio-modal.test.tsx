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
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<CreatePortfolioModal onClose={vi.fn<() => void>()} />);
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/broker/i)).toBeInTheDocument();
  });

  it("shows validation error when submitting with empty name", async () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<CreatePortfolioModal onClose={vi.fn<() => void>()} />);
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /create/i }));
    await expect(screen.findByText(/name is required/i)).resolves.toBeInTheDocument();
  });

  it("clears name error when user types", async () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    render(<CreatePortfolioModal onClose={vi.fn<() => void>()} />);
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /create/i }));
    await expect(screen.findByText(/name is required/i)).resolves.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^name$/i), "x");
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const onClose = vi.fn<() => void>();
    render(<CreatePortfolioModal onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when X button is clicked", () => {
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const onClose = vi.fn<() => void>();
    render(<CreatePortfolioModal onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
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
    useAppStore.setState({ data: defaultAppData, isLoading: false, loadError: undefined });
    const onClose = vi.fn<() => void>();
    render(<CreatePortfolioModal onClose={onClose} />);
    await userEvent.type(screen.getByLabelText(/^name$/i), "My Fund");
    await userEvent.type(screen.getByLabelText(/broker/i), "Degiro");
    fireEvent.click(screen.getByRole("button", { hidden: true, name: /create/i }));
    expect(useAppStore.getState().data.portfolios).toHaveLength(1);
    expect(useAppStore.getState().data.portfolios[0]?.name).toBe("My Fund");
    expect(useAppStore.getState().data.portfolios[0]?.broker).toBe("Degiro");
    expect(onClose).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/portfolios/$id" }));
  });
});

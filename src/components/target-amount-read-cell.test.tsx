import { act, fireEvent, render, screen } from "@testing-library/react";
import { invariant } from "es-toolkit";
import { TrendingUp } from "lucide-react";
import { TargetAmountReadCell } from "./target-amount-read-cell.tsx";

describe("TargetAmountReadCell", () => {
  it("shows popover on hover and hides after mouse leave delay", () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    render(<TargetAmountReadCell amount={10} amountPercentageLabel="25%" isin="LU1234567890" targetAmount={20} targetInvestment={500} trendIcon={<TrendingUp data-testid="target-trend-icon" />} />);

    const wrapper = screen.getByTestId("target-amount-read").parentElement;
    expect(wrapper).toBeDefined();
    invariant(wrapper, "target amount wrapper should be defined");

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByTestId("target-worth-popover-lu1234567890")).toHaveTextContent("To invest : 500 €");

    fireEvent.mouseLeave(wrapper);
    act(() => vi.advanceTimersByTime(151));
    expect(screen.queryByTestId("target-worth-popover-lu1234567890")).toBeNull();
    vi.useRealTimers();
  });

  it("shows a dash target investment when price is unavailable", () => {
    expect.hasAssertions();
    render(<TargetAmountReadCell amount={10} amountPercentageLabel="25%" isin="LU1111111111" targetAmount={20} targetInvestment={undefined} trendIcon={<TrendingUp data-testid="target-trend-icon" />} />);

    const wrapper = screen.getByTestId("target-amount-read").parentElement;
    expect(wrapper).toBeDefined();
    invariant(wrapper, "target amount wrapper should be defined");

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByTestId("target-worth-popover-lu1111111111")).toHaveTextContent("To invest : —");
  });

  it("does not show popover when amount equals target amount", () => {
    expect.hasAssertions();
    render(<TargetAmountReadCell amount={10} amountPercentageLabel="25%" isin="LU2222222222" targetAmount={10} targetInvestment={0} trendIcon={<TrendingUp data-testid="target-trend-icon" />} />);

    const wrapper = screen.getByTestId("target-amount-read").parentElement;
    expect(wrapper).toBeDefined();
    invariant(wrapper, "target amount wrapper should be defined");

    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByTestId("target-worth-popover-lu2222222222")).toBeNull();
  });
});

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = {
  error: Error | undefined;
};

export class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { error: undefined };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public render() {
    if (this.state.error)
      return (
        <div className="p-6">
          <div role="alert" className="alert alert-error">
            <span>Something went wrong: {this.state.error.message}</span>
            {this.props.onReset !== undefined && (
              <button type="button" className="btn btn-sm" onClick={this.props.onReset}>
                Retry
              </button>
            )}
          </div>
        </div>
      );
    return this.props.children;
  }
}

import { Component, type ReactNode } from "react";
import { messages as en } from "../locales/en.ts";
import { createTranslate, TranslationContext } from "../utils/translations.ts";

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = {
  error: Error | undefined;
};

export class ErrorBoundary extends Component<Props, State> {
  public static contextType = TranslationContext;
  declare public context: React.ContextType<typeof TranslationContext>;

  public constructor(props: Props) {
    super(props);
    this.state = { error: undefined };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public render() {
    if (this.state.error) {
      const translate = createTranslate(this.context?.messages ?? en);
      return (
        <div className="p-6">
          <div role="alert" data-testid="error-alert" className="alert alert-error">
            <span data-testid="error-message">{translate("error-something-went-wrong", { message: this.state.error.message })}</span>
            {this.props.onReset !== undefined && (
              <button type="button" data-testid="retry-button" className="btn btn-sm" onClick={this.props.onReset}>
                {translate("action-retry")}
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

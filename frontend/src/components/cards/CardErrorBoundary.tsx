import { Component, type ReactNode } from "react";
import { Card, Notice } from "@/components/ui";

interface Props {
  cardType: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card title={`Error: ${this.props.cardType}`} className="base-card">
          <Notice tone="negative" title="Error">
            {this.state.error?.message || "Unknown error"}
          </Notice>
        </Card>
      );
    }

    return this.props.children;
  }
}

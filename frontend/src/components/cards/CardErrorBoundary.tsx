import { Component, type ReactNode } from "react";
import { Card, CardHeader } from "@ui5/webcomponents-react";

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
        <Card
          header={
            <CardHeader
              titleText={`Error: ${this.props.cardType}`}
              additionalText="Error"
            />
          }
        >
          <div style={{ padding: "0.5rem", color: "var(--sapNegativeColor)" }}>
            <p>{this.state.error?.message || "Unknown error"}</p>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

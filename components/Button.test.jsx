import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PropTypes from "prop-types";
import { ThemeProvider } from "../components/ThemeProvider";
import { Button } from "../components/Button";

// Test wrapper with theme provider
const TestWrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

TestWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

describe("Button Component", () => {
  it("renders with default props", () => {
    render(
      <TestWrapper>
        <Button>Click me</Button>
      </TestWrapper>
    );

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn-base");
  });

  it("renders with different variants", () => {
    const { rerender } = render(
      <TestWrapper>
        <Button variant="primary">Primary</Button>
      </TestWrapper>
    );

    expect(screen.getByRole("button")).toHaveClass("btn-primary");

    rerender(
      <TestWrapper>
        <Button variant="secondary">Secondary</Button>
      </TestWrapper>
    );

    expect(screen.getByRole("button")).toHaveClass("btn-secondary");
  });

  it("renders with different sizes", () => {
    const { rerender } = render(
      <TestWrapper>
        <Button size="small">Small</Button>
      </TestWrapper>
    );

    expect(screen.getByRole("button")).toHaveClass("btn-sm");

    rerender(
      <TestWrapper>
        <Button size="large">Large</Button>
      </TestWrapper>
    );

    expect(screen.getByRole("button")).toHaveClass("btn-lg");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();

    render(
      <TestWrapper>
        <Button onClick={handleClick}>Click me</Button>
      </TestWrapper>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <TestWrapper>
        <Button disabled>Disabled</Button>
      </TestWrapper>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("applies custom className", () => {
    render(
      <TestWrapper>
        <Button className="custom-class">Custom</Button>
      </TestWrapper>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});

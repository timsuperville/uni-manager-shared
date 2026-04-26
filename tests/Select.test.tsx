import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "../components/ui/Select";
import React from "react";

describe("Select Component", () => {
  it("should handle multiple mode selections correctly", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const options = [
      { value: "ESV", label: "English Standard Version" },
      { value: "NIV", label: "New International Version" },
      { value: "KJV", label: "King James Version" },
    ];

    render(
      <Select
        multiple
        options={options}
        value={["ESV"]}
        onChange={handleChange}
        data-testid="multi-select"
      />,
    );

    const select = screen.getByTestId("multi-select") as HTMLSelectElement;
    expect(select.multiple).toBe(true);

    // Simulate selecting NIV (in addition to ESV which is the current value,
    // actually userEvent.selectOptions adds to selection if it's multiple)
    await user.selectOptions(select, ["NIV"]);

    // The onChange handler should be called
    expect(handleChange).toHaveBeenCalled();
    const firstCallArgs = handleChange.mock.calls[0];

    // Check that the first argument is exactly an array of strings
    expect(firstCallArgs[0]).toEqual(["ESV", "NIV"]);

    // Check that the second argument is the event object
    expect(firstCallArgs[1]).toBeDefined();
    expect(firstCallArgs[1].target).toBeDefined();
  });
});

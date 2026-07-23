import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import HomePage from "../../app/page";

it("renders the virpo home heading", () => {
  render(<HomePage />);

  expect(screen.getByRole("heading", { level: 1, name: "virpo" })).toBeVisible();
});

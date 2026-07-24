import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import HomePage from "../../app/page";

it("renders Peter's homepage introduction", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", { level: 1, name: /product engineer from Slovakia/i }),
  ).toBeVisible();
});

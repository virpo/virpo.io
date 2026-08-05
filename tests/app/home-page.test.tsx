import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import HomePage from "../../app/page";

it("renders Peter's homepage introduction", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: /I like living somewhere between product, design, and engineering/i,
    }),
  ).toBeVisible();
});

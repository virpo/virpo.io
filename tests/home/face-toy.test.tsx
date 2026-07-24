import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FaceToy, getFaceImageUrl } from "../../components/home/FaceToy";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mockFinePointer(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches }),
  });
}

describe("FaceToy", () => {
  it("tracks a fine pointer using the legacy quantized gaze images", () => {
    mockFinePointer(true);
    const { container } = render(<FaceToy />);
    const tracker = container.querySelector(".faceTracker");
    const image = screen.getByRole("img", { name: "Peter Hraska" });

    vi.spyOn(tracker as HTMLElement, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });

    const pointerMove = new Event("pointermove");
    Object.defineProperties(pointerMove, {
      clientX: { value: 100 },
      clientY: { value: 0 },
    });
    fireEvent(window, pointerMove);

    expect(image).toHaveAttribute("src", getFaceImageUrl(15, 15));
  });

  it("stays neutral when the device has no fine pointer", () => {
    mockFinePointer(false);
    render(<FaceToy />);
    const image = screen.getByRole("img", { name: "Peter Hraska" });

    fireEvent.pointerMove(window, { clientX: 100, clientY: 0 });

    expect(image).toHaveAttribute("src", getFaceImageUrl(0, 0));
  });
});

import { Container, Graphics, Text, TextStyle } from "pixi.js";

/**
 * Simple FPS counter with an auto-resizing background.
 * - Keeps right padding consistent regardless of text width.
 * - Handles invalid FPS values (NaN, undefined, etc.).
 * - Redraws background only when width changes (to avoid jitter).
 */
export class FpsCounter extends Container {
  private label: Text;
  private bg: Graphics;
  private lastUpdate = 0;
  private lastTextWidth = 0;

  private readonly padX = 6;
  private readonly padY = 4;

  constructor() {
    super();

    this.bg = new Graphics();
    this.addChild(this.bg);
    this.label = new Text(
      "FPS: —",
      new TextStyle({
        fill: 0xffffff,
        fontSize: 14,
        fontFamily: "Inter, Arial, sans-serif",
        stroke: 0x000000,
        strokeThickness: 3,
      })
    );
    this.label.position.set(this.padX, this.padY);
    this.addChild(this.label);

    // Initial background render
    this.redrawBg();
  }

  /**
   * Draws or updates the semi-transparent background box.
   * Ensures minimum width and height so it looks consistent on all devices.
   */
  private redrawBg() {
    const textW = Math.max(48, this.label.width);
    const textH = Math.max(20, this.label.height);
    const w = textW + this.padX * 2;
    const h = textH + this.padY * 2;

    this.bg.clear();
    this.bg.beginFill(0x000000, 0.55);
    this.bg.lineStyle(1, 0x2a2d44, 1);
    this.bg.drawRoundedRect(0, 0, w, h, 6);
    this.bg.endFill();
  }

  /**
   * Updates the displayed FPS value and resizes the background if needed.
   * @param nowMs - current timestamp (usually performance.now()).
   * @param fps - current frames per second from app.ticker.FPS.
   */
  update(nowMs: number, fps: number) {
    // Update text every ~200ms to avoid unnecessary redraws.
    if (nowMs - this.lastUpdate > 200) {
      const safeFps =
        typeof fps === "number" && isFinite(fps) ? fps.toFixed(0) : "--";

      this.label.text = `FPS: ${safeFps}`;
      this.lastUpdate = nowMs;

      // Redraw background only if text width changed
      const textW = this.label.width;
      if (Math.abs(textW - this.lastTextWidth) > 1) {
        this.lastTextWidth = textW;
        this.redrawBg();
      }
    }
  }
}

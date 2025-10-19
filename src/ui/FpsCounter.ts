import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class FpsCounter extends Container {
  private label: Text;
  private bg: Graphics;
  private lastUpdate = 0;

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
    this.redrawBg();
  }

  private redrawBg() {
    const w = this.label.width + this.padX * 2;
    const h = this.label.height + this.padY * 2;

    this.bg.clear();
    this.bg.beginFill(0x000000, 0.55);
    this.bg.lineStyle(1, 0x2a2d44, 1);
    this.bg.drawRoundedRect(0, 0, Math.max(48, w), Math.max(20, h), 6);
    this.bg.endFill();
  }

  update(nowMs: number, fps: number) {
    if (nowMs - this.lastUpdate > 200) {
      this.label.text = `FPS: ${fps.toFixed(0)}`;
      this.lastUpdate = nowMs;
    }
  }
}

import { Container, Graphics, Text, TextStyle } from "pixi.js";

export class Button extends Container {
  private bg: Graphics;
  private label: Text;

  constructor(text: string, width = 180, height = 42) {
    super();
    this.eventMode = "static";
    this.cursor = "pointer";

    this.bg = new Graphics();
    this.bg.beginFill(0x2a2d44);
    this.bg.lineStyle(2, 0x0a0b12);
    this.bg.drawRoundedRect(0, 0, width, height, 12);
    this.bg.endFill();

    this.label = new Text(
      text,
      new TextStyle({
        fill: 0xffffff,
        fontSize: 16,
        fontFamily: "Inter, sans-serif",
        fontWeight: "600",
      })
    );
    this.label.anchor.set(0.5);
    this.label.position.set(width / 2, height / 2);

    this.addChild(this.bg, this.label);

    this.on("pointerdown", () => this.scale.set(0.98));
    this.on("pointerup", () => this.scale.set(1));
    this.on("pointerupoutside", () => this.scale.set(1));
  }
}

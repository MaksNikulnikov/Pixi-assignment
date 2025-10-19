import { Container, Graphics, Text, TextStyle, Application } from "pixi.js";
import type { IScene } from "@core/Scene";
import { Button } from "@ui/Button";

export class MenuScene implements IScene {
  public readonly view = new Container();

  constructor(
    private onOpenAce: () => void,
    private onOpenMagic: () => void,
    private onOpenPhoenix: () => void
  ) {}

  onEnter(app: Application) {
    const bg = new Graphics();
    this.view.addChild(bg);

    const title = new Text(
      "Pixi Assignment",
      new TextStyle({
        fill: 0xffffff,
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: 1,
        fontFamily: "Inter, sans-serif",
      })
    );
    title.anchor.set(0.5);
    this.view.addChild(title);

    const btnAce = new Button("1) Ace of Shadows");
    const btnMagic = new Button("2) Magic Words");
    const btnPhoenix = new Button("3) Phoenix Flame");
    const buttons = [btnAce, btnMagic, btnPhoenix];

    buttons.forEach((b) => this.view.addChild(b));

    btnAce.on("pointerup", this.onOpenAce);
    btnMagic.on("pointerup", this.onOpenMagic);
    btnPhoenix.on("pointerup", this.onOpenPhoenix);

    const onResize = () => {
      const { width, height } = app.renderer.screen;

      bg.clear();
      bg.beginFill(0x0b0b11);
      bg.drawRect(0, 0, width, height);
      bg.endFill();

      title.position.set(width / 2, height * 0.15);

      const buttonHeight = 56;
      const totalHeight = buttons.length * buttonHeight;
      const startY = height / 2 - totalHeight / 2;

      buttons.forEach((b, i) => {
        b.position.set(width / 2 - b.width / 2, startY + i * buttonHeight);
      });
    };

    (this.view as any)._onResize = onResize;
    onResize();
  }

  onExit() {}
}

import { Container, Graphics } from "pixi.js";
import type { IScene } from "@core/Scene";
import { Button } from "@ui/Button";
import { GAME_SIZE } from "@config/gameSize";

export class MenuScene implements IScene {
  public readonly view = new Container();

  constructor(
    private onOpenAce: () => void,
    private onOpenMagic: () => void,
    private onOpenPhoenix: () => void
  ) {}

  onEnter() {
    const bg = new Graphics();
    this.view.addChild(bg);

    bg.beginFill(0x0b0b11);
    bg.drawRect(0, 0, GAME_SIZE.WIDTH, GAME_SIZE.HEIGHT);
    bg.endFill();

    const btnAce = new Button("1) Ace of Shadows");
    const btnMagic = new Button("2) Magic Words");
    const btnPhoenix = new Button("3) Phoenix Flame");
    const buttons = [btnAce, btnMagic, btnPhoenix];

    buttons.forEach((b) => this.view.addChild(b));

    btnAce.on("pointerup", this.onOpenAce);
    btnMagic.on("pointerup", this.onOpenMagic);
    btnPhoenix.on("pointerup", this.onOpenPhoenix);

    const buttonHeight = 56;
    const totalHeight = buttons.length * buttonHeight;
    const startY = GAME_SIZE.HEIGHT / 2 - totalHeight / 2;

    buttons.forEach((b, i) => {
      b.position.set(
        GAME_SIZE.WIDTH / 2 - b.width / 2,
        startY + i * buttonHeight
      );
    });
  }

  onExit() {}
}

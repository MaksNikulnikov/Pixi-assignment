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
    const bg = new Graphics()
      .beginFill(0x0b0b11)
      .drawRect(0, 0, GAME_SIZE.WIDTH, GAME_SIZE.HEIGHT)
      .endFill();
    this.view.addChild(bg);

    const btnAce = new Button("1) Ace of Shadows");
    const btnMagic = new Button("2) Magic Words");
    const btnPhoenix = new Button("3) Phoenix Flame");
    const buttons = [btnAce, btnMagic, btnPhoenix];

    buttons.forEach((b) => this.view.addChild(b));

    btnAce.on("pointerup", () => {
      this.onOpenAce();
    });
    btnMagic.on("pointerup", () => {
      this.onOpenMagic();
    });
    btnPhoenix.on("pointerup", () => {
      this.onOpenPhoenix();
    });

    const buttonHeight = 56;
    const totalHeight = buttons.length * buttonHeight;
    const startY = GAME_SIZE.HEIGHT / 2 - totalHeight / 2;

    buttons.forEach((b, i) => {
      b.position.set(GAME_SIZE.WIDTH / 2 - b.width / 2, startY + i * buttonHeight);
    });
    this.onResize();
  }
  
  onResize(){
    const vw = GAME_SIZE.WIDTH;
    const vh = GAME_SIZE.HEIGHT;
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    const scale = Math.min(ww / vw, wh / vh);
    const x = (ww - vw * scale) / 2;
    const y = (wh - vh * scale) / 2;

    this.view.scale.set(scale);
    this.view.position.set(x, y);
  }

  onExit() {}
}

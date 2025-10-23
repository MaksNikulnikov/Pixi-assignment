import { Container, Graphics, Application } from "pixi.js";
import type { IScene } from "@core/Scene";
import { GAME_SIZE } from "@config/gameSize";

export class BaseScene implements IScene {
  public readonly view = new Container();

  protected bg = new Graphics();

  constructor(protected bgColor: number) {}

  onEnter() {
    this.view.addChild(this.bg);

    this.bg.beginFill(this.bgColor);
    this.bg.drawRect(0, 0, GAME_SIZE.WIDTH, GAME_SIZE.HEIGHT);
    this.bg.endFill();
    this.onResize();
  }

  onExit() {}

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
}

import { Container, Graphics, Application } from "pixi.js";
import type { IScene } from "@core/Scene";
import { GAME_SIZE } from "@config/gameSize";

export class BaseScene implements IScene {
  public readonly view = new Container();

  protected bg = new Graphics();

  constructor(protected bgColor: number) {}

  onEnter(app: Application) {
    this.view.addChild(this.bg);

    this.bg.beginFill(this.bgColor);
    this.bg.drawRect(0, 0, GAME_SIZE.WIDTH, GAME_SIZE.HEIGHT);
    this.bg.endFill();
  }

  onExit() {}
}

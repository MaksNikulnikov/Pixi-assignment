import type { Application, Container } from "pixi.js";

export interface IScene {
  readonly view: Container;
  onEnter(app: Application): Promise<void> | void;
  onExit(app: Application): Promise<void> | void;
}

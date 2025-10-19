import type { Application } from "pixi.js";
import type { IScene } from "./Scene";

export class SceneManager {
  private current: IScene | null = null;

  constructor(private app: Application) {}

  get scene() {
    return this.current;
  }

  async set(scene: IScene) {
    if (this.current) {
      await this.current.onExit(this.app);
      this.app.stage.removeChild(this.current.view);
    }
    this.current = scene;
    await scene.onEnter(this.app);
    this.app.stage.addChild(scene.view);
  }
}

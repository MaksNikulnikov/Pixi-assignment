import { BaseScene } from "@scenes/BaseScene";
import type { Application } from "pixi.js";

export class PhoenixFlameScene extends BaseScene {
  constructor(onBack: () => void) {
    super("Phoenix Flame — WIP", 0x170f0a, onBack);
  }

  override onEnter(app: Application) {
    super.onEnter(app);
  }
}

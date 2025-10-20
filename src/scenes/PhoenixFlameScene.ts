import { BACKGROUND_COLORS } from "@config/backgroundColors";
import { BaseScene } from "@scenes/BaseScene";
import type { Application } from "pixi.js";

export class PhoenixFlameScene extends BaseScene {
  constructor() {
    super(BACKGROUND_COLORS.TREE);
  }

  override onEnter(app: Application) {
    super.onEnter(app);
  }
}

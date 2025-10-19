import { BaseScene } from "@scenes/BaseScene";
import type { Application } from "pixi.js";

export class AceOfShadowsScene extends BaseScene {
  constructor(onBack: () => void) {
    super("Ace of Shadows — WIP", 0x131421, onBack);
  }

  override onEnter(app: Application) {
    super.onEnter(app);
  }
}

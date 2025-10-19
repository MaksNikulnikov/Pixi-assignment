import { BaseScene } from "@scenes/BaseScene";
import type { Application } from "pixi.js";

export class MagicWordsScene extends BaseScene {
  constructor(onBack: () => void) {
    super("Magic Words — WIP", 0x10161f, onBack);
  }

  override onEnter(app: Application) {
    super.onEnter(app);
  }
}

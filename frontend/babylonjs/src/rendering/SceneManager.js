import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Sound,
} from "@babylonjs/core";
import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/loaders";

export class SceneManager {
  constructor(canvas) {
    this.engine = new Engine(canvas, true, { audioEngine: true });
    this.scene = new Scene(this.engine);
  }

  createCamera(canvas) {
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 4,
      Math.PI / 3,
      18,
      Vector3.Zero(),
      this.scene,
    );
    camera.attachControl(canvas, true);
    camera.lowerBetaLimit = 0.3;
    camera.upperBetaLimit = 1.2;
    camera.wheelDeltaPercentage = 0.01;
    if (camera.inputs.attached.keyboard) {
      camera.inputs.remove(camera.inputs.attached.keyboard);
    }
    return camera;
  }

  createLights() {
    const light = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      this.scene,
    );
    light.intensity = 0.9;
    return light;
  }

  createSounds() {
    return {
      move: new Sound("move-self", "/assets/sounds/move-self.mp3", this.scene, null, {
        volume: 0.4,
      }),
      capture: new Sound("capture", "/assets/sounds/capture.mp3", this.scene, null, {
        volume: 0.5,
      }),
      castle: new Sound("castle", "/assets/sounds/castle.mp3", this.scene, null, {
        volume: 0.5,
      }),
      promote: new Sound("promote", "/assets/sounds/promote.mp3", this.scene, null, {
        volume: 0.55,
      }),
    };
  }

  unlockAudioOnFirstInteraction(canvas) {
    const unlockAudio = () => {
      const audioEngine = Engine.audioEngine || this.engine.getAudioEngine?.();
      if (audioEngine && !audioEngine.unlocked) audioEngine.unlock();
    };

    canvas?.addEventListener("pointerdown", unlockAudio, { once: true });
    document.addEventListener("pointerdown", unlockAudio, { once: true });
    document.addEventListener("keydown", unlockAudio, { once: true });
    return unlockAudio;
  }
}

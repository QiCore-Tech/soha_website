import type { RefObject } from "react";
import type { Object3D } from "three";

export type LaptopController = { render: (progress: number) => void };
export type WorkspaceDevice = "laptop" | "phone";
export type LaptopSceneProps = {
  model: Object3D;
  device: WorkspaceDevice;
  screenRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  hintRef: RefObject<HTMLDivElement | null>;
  onReady: (controller: LaptopController) => void;
  onFailure: () => void;
};

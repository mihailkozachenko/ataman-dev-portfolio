export type MachineConfig = {
  src: string;
  /** Intrinsic PNG size. Update it when you swap in your own image so the aspect ratio stays right. */
  width: number;
  height: number;
  /**
   * Where the fog / bubbles come out, as a fraction of the image box:
   * x: 0 = left edge, 1 = right edge; y: 0 = top, 1 = bottom.
   */
  nozzle: { x: number; y: number };
  /** Direction of the stream in degrees: 0 = right, -90 = straight up, 180 = left. */
  angle: number;
};

export const fogMachine: MachineConfig = {
  src: "/fog-machine.png",
  width: 320,
  height: 240,
  nozzle: { x: 0.95, y: 0.55 },
  angle: -25,
};

export const bubbleMachine: MachineConfig = {
  src: "/bubble-machine.png",
  width: 320,
  height: 240,
  nozzle: { x: 0.2, y: 0.17 },
  angle: -125,
};

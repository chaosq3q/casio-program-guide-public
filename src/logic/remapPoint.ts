export type Point2D = {
  x: number;
  y: number;
};

const X_SCALE = 1.5601965602;
const X_OFFSET = -28.0577395577;
const Y_SCALE = 0.9952019417;
const Y_OFFSET = 0.5313454369;

export function remapPoint(point: Point2D): Point2D {
  return {
    x: X_SCALE * point.x + X_OFFSET,
    y: Y_SCALE * point.y + Y_OFFSET,
  };
}

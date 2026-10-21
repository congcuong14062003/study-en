import type { Point } from "hanzi-writer";

type BoundEvent = { getPoint(): Point; preventDefault(): void };
type Target = {
  node: SVGElement;
  svg: SVGElement;
  defs: SVGDefsElement;
  createSubRenderTarget(): Target;
  addPointerStartListener(callback: (event: BoundEvent) => void): void;
  addPointerMoveListener(callback: (event: BoundEvent) => void): void;
  addPointerEndListener(callback: () => void): void;
  getBoundingClientRect(): DOMRect;
  updateDimensions(width: string | number, height: string | number): void;
  _eventify<T extends Event>(event: T, point: (event: T) => Point): BoundEvent;
  _getMousePoint(event: MouseEvent): Point;
  _getTouchPoint(event: TouchEvent): Point;
};

/** Use the library's renderer hook so pointer capture and every listener have a lifecycle.
 * The default 3.x target adds document mouseup/touchend listeners with no disposal API.
 */
export function createHanziPracticeTarget(element: string | HTMLElement, width: string | number = 280, height: string | number = 280, signal: AbortSignal): Target {
  const host = typeof element === "string" ? document.getElementById(element) : element;
  if (!host) throw new Error("Không tìm thấy vùng luyện viết.");
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const defs = document.createElementNS(ns, "defs");
  svg.appendChild(defs);
  host.appendChild(svg);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Vùng viết chữ Hán bằng chuột hoặc chạm");
  let pointerId: number | null = null;
  const point = (clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * Number(svg.getAttribute("width")) / (rect.width || 1),
      y: (clientY - rect.top) * Number(svg.getAttribute("height")) / (rect.height || 1),
    };
  };
  const bound = (event: PointerEvent): BoundEvent => ({ getPoint: () => point(event.clientX, event.clientY), preventDefault: () => event.preventDefault() });
  const targetFor = (node: SVGElement): Target => ({
    node, svg: node, defs,
    createSubRenderTarget() {
      const group = document.createElementNS(ns, "g");
      node.appendChild(group);
      return targetFor(group);
    },
    addPointerStartListener(callback) {
      svg.addEventListener("pointerdown", (event) => {
        if (!event.isPrimary || pointerId !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
        pointerId = event.pointerId;
        svg.setPointerCapture(event.pointerId);
        callback(bound(event));
      }, { signal });
    },
    addPointerMoveListener(callback) {
      svg.addEventListener("pointermove", (event) => { if (event.pointerId === pointerId) callback(bound(event)); }, { signal });
    },
    addPointerEndListener(callback) {
      const end = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        pointerId = null;
        callback();
      };
      svg.addEventListener("pointerup", end, { signal });
      svg.addEventListener("pointercancel", end, { signal });
      svg.addEventListener("lostpointercapture", end, { signal });
    },
    getBoundingClientRect: () => svg.getBoundingClientRect(),
    updateDimensions(w, h) {
      svg.setAttribute("width", String(w)); svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    },
    _eventify: (event, getPoint) => ({ getPoint: () => getPoint(event), preventDefault: () => event.preventDefault() }),
    _getMousePoint: (event) => point(event.clientX, event.clientY),
    _getTouchPoint: (event) => point(event.touches[0].clientX, event.touches[0].clientY),
  });
  const target = targetFor(svg);
  target.updateDimensions(width, height);
  return target;
}

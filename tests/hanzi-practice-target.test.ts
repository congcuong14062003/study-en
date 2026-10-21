import test from "node:test";
import assert from "node:assert/strict";
import { createHanziPracticeTarget } from "../src/lib/hanzi-practice-target";

class FakeSvg extends EventTarget {
  attributes = new Map<string, string>();
  children: FakeSvg[] = [];
  captured: number | null = null;
  appendChild(child: FakeSvg) { this.children.push(child); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name); }
  getBoundingClientRect() { return { left: 10, top: 20, width: 140, height: 140 }; }
  setPointerCapture(id: number) { this.captured = id; }
}

test("practice pointer capture respects scaling/direction and abort removes every input listener", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElementNS: () => new FakeSvg(),
    addEventListener: () => { throw new Error("No global document listeners allowed"); },
  } });
  try {
    const controller = new AbortController();
    const host = new FakeSvg();
    const target = createHanziPracticeTarget(host as unknown as HTMLElement, 280, 280, controller.signal);
    const svg = host.children[0];
    let started = 0, moved = 0, ended = 0;
    target.addPointerStartListener((event) => { started++; assert.deepEqual(event.getPoint(), { x: 140, y: 140 }); });
    target.addPointerMoveListener(() => moved++);
    target.addPointerEndListener(() => ended++);
    const dispatch = (type: string, id = 1, primary = true, button = 0) => {
      const event = new Event(type, { cancelable: true });
      Object.assign(event, { pointerId: id, pointerType: "mouse", isPrimary: primary, button, clientX: 80, clientY: 90 });
      svg.dispatchEvent(event);
    };
    dispatch("pointerdown", 9, true, 2);
    dispatch("pointerdown", 9, false);
    assert.equal(started, 0);
    dispatch("pointerdown"); dispatch("pointermove", 2); dispatch("pointermove");
    assert.equal(svg.captured, 1); assert.equal(started, 1); assert.equal(moved, 1);
    dispatch("pointerup"); dispatch("lostpointercapture");
    assert.equal(ended, 1, "Pointer-up and lost capture must not submit the same stroke twice");
    target.updateDimensions(240, 240);
    assert.equal(svg.getAttribute("viewBox"), "0 0 240 240");
    controller.abort();
    dispatch("pointerdown"); dispatch("pointermove"); dispatch("pointerup");
    assert.equal(started, 1); assert.equal(moved, 1); assert.equal(ended, 1);
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  }
});

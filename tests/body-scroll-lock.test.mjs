import test from "node:test";
import assert from "node:assert/strict";
import { acquireBodyScrollLock } from "../src/lib/bodyScrollLock.ts";

function body(overflow = "", priority = "") {
  const values = new Map(overflow ? [["overflow", { value: overflow, priority }]] : []);
  return {
    style: {
      getPropertyValue: key => values.get(key)?.value ?? "",
      getPropertyPriority: key => values.get(key)?.priority ?? "",
      setProperty: (key, value, priority = "") => values.set(key, { value, priority }),
      removeProperty: key => values.delete(key),
    },
  };
}
function* orders(items) {
  if (!items.length) { yield []; return; }
  for (const item of items)
    for (const rest of orders(items.filter(other => other !== item))) yield [item, ...rest];
}

test("overlapping swap and other dialogs keep scrolling locked until the last closes, in any order", () => {
  for (const order of orders([0, 1, 2, 3, 4, 5])) {
    const target = body();
    const releases = order.map(() => acquireBodyScrollLock(target));
    for (const [index, owner] of order.entries()) {
      releases[owner]();
      assert.equal(target.style.getPropertyValue("overflow"), index === order.length - 1 ? "" : "hidden");
    }
  }
});

test("original overflow and CSS priority survive nested locks", () => {
  for (const original of ["auto", "scroll", "hidden"]) {
    const target = body(original, "important");
    const release = acquireBodyScrollLock(target);
    const releaseNested = acquireBodyScrollLock(target);
    release();
    releaseNested();
    assert.equal(target.style.getPropertyValue("overflow"), original);
    assert.equal(target.style.getPropertyPriority("overflow"), "important");
  }
});

test("duplicate or stale cleanups cannot unlock another dialog", () => {
  const target = body();
  const stale = acquireBodyScrollLock(target);
  stale();
  const current = acquireBodyScrollLock(target);
  stale();
  assert.equal(target.style.getPropertyValue("overflow"), "hidden");
  current();
  assert.equal(target.style.getPropertyValue("overflow"), "");
});

test("effect replay, replacements, and responsive changes preserve active owners", () => {
  const target = body("auto");
  const outer = acquireBodyScrollLock(target);
  const first = acquireBodyScrollLock(target);
  first();
  const replacement = acquireBodyScrollLock(target);
  outer();
  assert.equal(target.style.getPropertyValue("overflow"), "hidden");
  replacement();
  assert.equal(target.style.getPropertyValue("overflow"), "auto");
  const reopened = acquireBodyScrollLock(target);
  reopened();
  assert.equal(target.style.getPropertyValue("overflow"), "auto");
});

test("separate documents have independent scroll locks", () => {
  const a = body("auto"), b = body("scroll");
  const releaseA = acquireBodyScrollLock(a), releaseB = acquireBodyScrollLock(b);
  releaseA();
  assert.equal(a.style.getPropertyValue("overflow"), "auto");
  assert.equal(b.style.getPropertyValue("overflow"), "hidden");
  releaseB();
  assert.equal(b.style.getPropertyValue("overflow"), "scroll");
});

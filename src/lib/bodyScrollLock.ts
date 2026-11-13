type ScrollLock = {
  owners: Set<symbol>;
  overflow: string;
  priority: string;
};

const locks = new WeakMap<HTMLElement, ScrollLock>();

/** Every overlay owns a release token; only the last release restores scrolling. */
export function acquireBodyScrollLock(body: HTMLElement = document.body) {
  let lock = locks.get(body);
  if (!lock) {
    lock = {
      owners: new Set(),
      overflow: body.style.getPropertyValue("overflow"),
      priority: body.style.getPropertyPriority("overflow"),
    };
    locks.set(body, lock);
    body.style.setProperty("overflow", "hidden", lock.priority);
  }
  const owner = Symbol("body-scroll-lock");
  lock.owners.add(owner);
  return () => {
    if (!lock.owners.delete(owner) || lock.owners.size) return;
    if (lock.overflow) body.style.setProperty("overflow", lock.overflow, lock.priority);
    else body.style.removeProperty("overflow");
    locks.delete(body);
  };
}

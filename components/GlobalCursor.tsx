"use client";

import { useEffect, useRef } from "react";

export default function GlobalCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const mouse   = { x: 0, y: 0 };
    const lerpPos = { x: 0, y: 0 };
    let raf     = 0;
    let visible = false;

    // Center element at (x, y) using its current rendered size
    const center = (el: HTMLDivElement, x: number, y: number) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px)`;
    };

    const show = () => {
      if (!visible) {
        visible = true;
        dot.style.opacity  = "1";
        ring.style.opacity = "1";
      }
    };

    const hide = () => {
      visible = false;
      dot.style.opacity  = "0";
      ring.style.opacity = "0";
    };

    // RAF: lerp ring toward mouse each frame
    const tick = () => {
      lerpPos.x += (mouse.x - lerpPos.x) * 0.12;
      lerpPos.y += (mouse.y - lerpPos.y) * 0.12;
      center(ring, lerpPos.x, lerpPos.y);
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      center(dot, e.clientX, e.clientY);

      if (!visible) {
        lerpPos.x = e.clientX;
        lerpPos.y = e.clientY;
        center(ring, e.clientX, e.clientY);
        show();
      }
    };

    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const isBtn  = !!el.closest("a, button, [role='button'], label, [tabindex='0']");
      const isText = !!el.closest("input, textarea, select");

      dot.classList.toggle("c-hover", isBtn);
      dot.classList.toggle("c-text",  isText && !isBtn);
      ring.classList.toggle("c-hover", isBtn);
      ring.classList.toggle("c-text",  isText && !isBtn);
    };

    raf = requestAnimationFrame(tick);
    document.addEventListener("mousemove",  onMove, { passive: true });
    document.addEventListener("mouseover",  onOver, { passive: true });
    document.addEventListener("mouseleave", hide);
    document.addEventListener("mouseenter", show);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseover",  onOver);
      document.removeEventListener("mouseleave", hide);
      document.removeEventListener("mouseenter", show);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="c-dot"  aria-hidden="true" />
      <div ref={ringRef} className="c-ring" aria-hidden="true" />
    </>
  );
}

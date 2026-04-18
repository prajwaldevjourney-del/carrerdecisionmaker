"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Current mouse position
    const mouse = { x: -200, y: -200 };
    // Ring lerp position
    const lerp  = { x: -200, y: -200 };
    let rafId   = 0;
    let entered = false;

    // Position dot instantly via transform (GPU layer, no layout)
    const moveDot = (x: number, y: number) => {
      dot.style.transform = `translate(${x}px, ${y}px)`;
    };

    // Position ring via transform
    const moveRing = (x: number, y: number) => {
      ring.style.transform = `translate(${x}px, ${y}px)`;
    };

    // RAF loop — only lerps the ring
    const tick = () => {
      lerp.x += (mouse.x - lerp.x) * 0.11;
      lerp.y += (mouse.y - lerp.y) * 0.11;
      moveRing(lerp.x, lerp.y);
      rafId = requestAnimationFrame(tick);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      moveDot(e.clientX, e.clientY);

      if (!entered) {
        // Snap ring to cursor on first move so it doesn't slide from corner
        lerp.x = e.clientX;
        lerp.y = e.clientY;
        entered = true;
        dot.style.opacity  = "1";
        ring.style.opacity = "1";
      }
    };

    const onMouseLeave = () => {
      dot.style.opacity  = "0";
      ring.style.opacity = "0";
      entered = false;
    };

    const onMouseEnter = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      lerp.x  = e.clientX;
      lerp.y  = e.clientY;
      moveDot(e.clientX, e.clientY);
      moveRing(e.clientX, e.clientY);
      dot.style.opacity  = "1";
      ring.style.opacity = "1";
      entered = true;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.closest(
        "a, button, [role='button'], input, textarea, select, label, [tabindex]"
      );
      if (isInteractive) {
        dot.classList.add("cursor-hover");
        ring.classList.add("cursor-hover");
      } else {
        dot.classList.remove("cursor-hover");
        ring.classList.remove("cursor-hover");
      }
    };

    rafId = requestAnimationFrame(tick);

    document.addEventListener("mousemove",  onMouseMove,  { passive: true });
    document.addEventListener("mouseover",  onMouseOver,  { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove",  onMouseMove);
      document.removeEventListener("mouseover",  onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <>
      {/* Dot — snaps instantly */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="cursor-dot"
        style={{ top: 0, left: 0, opacity: 0 }}
      />
      {/* Ring — lerps smoothly */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="cursor-ring"
        style={{ top: 0, left: 0, opacity: 0 }}
      />
    </>
  );
}

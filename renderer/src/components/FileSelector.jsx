import { useState, useRef, useEffect, useCallback } from "react";

const FileSelector = ({ items, render, selectedIds, onSelectionChange }) => {
  const containerRef = useRef(null);
  const selectionRef = useRef(null);
  const rafRef = useRef(null);
  const rafScrollRef = useRef(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isCtrlKey, setIsCtrlKey] = useState(false);

  const lastMouseEventRef = useRef(null);
  const dragStartSelectionRef = useRef(new Set()); // snapshot of selection at drag start (ctrl+ drag appends to this)
  const dragAccumulatedRef = useRef(new Set()); // accumulated selection during drag (persist across scrolling)

  //const dragModeRef = useRef("add"); // 'add' or 'remove' during drag
  //const dragTouchedRef = useRef(new Set());

  const isSelectingRef = useRef(false);

  // update ctrl key state dynamically
  useEffect(() => {
    const handleKeyDown = (e) => e.ctrlKey && setIsCtrlKey(true);
    const handleKeyUp = (e) => !e.ctrlKey && setIsCtrlKey(false);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const computeSelectionBounds = () => {
    const minX = Math.min(startPos.x, currentPos.x);
    const minY = Math.min(startPos.y, currentPos.y);
    const maxX = Math.max(startPos.x, currentPos.x);
    const maxY = Math.max(startPos.y, currentPos.y);
    return { minX, minY, maxX, maxY };
  };

  const updateSelection = useCallback(() => {
    if (!isSelectingRef.current) return; // only update during active drag

    const { minX, minY, maxX, maxY } = computeSelectionBounds();
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const selectableItems =
      containerRef.current.querySelectorAll("[data-selectable]"); // all selectable items in the container

    const frameIntersections = []; // to store items that intersect with the selection box

    selectableItems.forEach((item) => {
      const rect = item.getBoundingClientRect();

      const itemTop =
        rect.top - containerRect.top + containerRef.current.scrollTop;
      const itemBottom =
        rect.bottom - containerRect.top + containerRef.current.scrollTop;
      const itemLeft =
        rect.left - containerRect.left + containerRef.current.scrollLeft;
      const itemRight =
        rect.right - containerRect.left + containerRef.current.scrollLeft;

      // convert band (viewport) into the same container-relative space
      const bandTop = minY - containerRect.top + container.scrollTop;
      const bandBottom = maxY - containerRect.top + container.scrollTop;
      const bandLeft = minX - containerRect.left + container.scrollLeft;
      const bandRight = maxX - containerRect.left + container.scrollLeft;

      const intersects =
        bandRight > itemLeft &&
        bandLeft < itemRight &&
        bandBottom > itemTop &&
        bandTop < itemBottom;

      if (intersects) {
        frameIntersections.push(item.dataset.id);
      }
    });

    // Build next selection from drag start + current intersections
    const next = new Set(isCtrlKey ? dragStartSelectionRef.current : new Set());

    frameIntersections.forEach((id) => {
      if (dragStartSelectionRef.current.has(id)) next.delete(id);
      else next.add(id);
    });

    onSelectionChange(next); // notify parent of changes
  }, [isCtrlKey, startPos, currentPos]);

  // continuous auto-scroll while dragging near edges
  const autoScrollLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const step = () => {
      if (!isSelectingRef.current || !containerRef.current) return;

      const e = lastMouseEventRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      const threshold = 60; // px from edge
      const vSpeed = 20; // vertical px/frame

      let scrolled = false;

      if (e) {
        // vertical auto-scroll
        if (e.clientY < rect.top + threshold) {
          const oldScroll = container.scrollTop;
          container.scrollTop = Math.max(0, container.scrollTop - vSpeed);
          scrolled = container.scrollTop !== oldScroll;
        } else if (e.clientY > rect.bottom - threshold) {
          const oldScroll = container.scrollTop;
          container.scrollTop = Math.min(
            container.scrollHeight - container.clientHeight,
            container.scrollTop + vSpeed
          );
          scrolled = container.scrollTop !== oldScroll;
        }
      }

      if (scrolled) updateSelection(); // only update if scroll actually moved

      rafRef.current = requestAnimationFrame(step); // schedule next frame
    };
    rafRef.current = requestAnimationFrame(step);
  }, [updateSelection]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;

    const item = e.target.closest("[data-selectable]");
    const itemId = item?.dataset.id;

    /*if (itemId) {
      // starting drag on an existing selected item -> remove mode
      dragModeRef.current = selectedIds.has(itemId) ? "remove" : "add";
    } else {
      dragModeRef.current = "add"; // blank space -> adding mode
    }*/

    // ctrl + click toggles selection
    if (e.ctrlKey && itemId) {
      // synchronously compute and set so refs remain consistent
      const newSet = new Set(selectedIds);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      onSelectionChange(newSet);
      return;
    }

    // single click selects only that item
    if (!e.ctrlKey && itemId) {
      onSelectionChange(new Set([itemId]));
      return;
    }

    if (e.target.closest("button, input, a")) return;

    // drag select anywhere in document
    setIsSelecting(true);
    isSelectingRef.current = true;
    //dragTouchedRef.current.clear();
    setIsCtrlKey(e.ctrlKey);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });

    // snapshot current selection & clear accumulated for this drag
    if (e.ctrlKey) {
      dragStartSelectionRef.current = new Set(selectedIds); // append to existing selection
    } else {
      dragStartSelectionRef.current = new Set(); // non-Ctrl: start fresh
      dragAccumulatedRef.current.clear(); // clear any old accumulated selections
      onSelectionChange(new Set()); // also clear App state
    }

    lastMouseEventRef.current = e;
    document.body.style.userSelect = "none";

    // show the selection box immediately
    if (selectionRef.current) {
      Object.assign(selectionRef.current.style, {
        left: `${e.clientX}px`,
        top: `${e.clientY}px`,
        width: `0px`,
        height: `0px`,
        display: "block",
      });
    }

    //autoScrollLoop(); // start continuous scroll watcher
  };

  const handleMouseMove = (e) => {
    if (!isSelectingRef.current) return;

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    // small threshold to prevent accidental drag
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

    setCurrentPos({ x: e.clientX, y: e.clientY });

    // update selection box
    const minX = Math.min(startPos.x, e.clientX);
    const minY = Math.min(startPos.y, e.clientY);
    const maxX = Math.max(startPos.x, e.clientX);
    const maxY = Math.max(startPos.y, e.clientY);

    if (selectionRef.current) {
      Object.assign(selectionRef.current.style, {
        left: `${minX}px`,
        top: `${minY}px`,
        width: `${maxX - minX}px`,
        height: `${maxY - minY}px`,
        display: "block",
      });
    }

    updateSelection();
  };

  const handleMouseUp = () => {
    if (!isSelectingRef.current) return;
    setIsSelecting(false);
    isSelectingRef.current = false;
    document.body.style.userSelect = "";
    if (selectionRef.current) selectionRef.current.style.display = "none";

    // stop auto-scroll RAF
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    //dragTouchedRef.current.clear(); // clear touched items for next drag

    // finalize and clear accumulation for future drags
    dragStartSelectionRef.current = new Set();
    dragAccumulatedRef.current.clear();
  };

  const handleGlobalMouseDown = (e) => {
    const container = containerRef.current;
    if (!container) return;

    // ignore clicks on interactive controls anywhere
    const isUIControl = e.target.closest("button, input, a, [data-no-clear]");
    if (isUIControl) return;

    // if click is outside container, reset *all* selection state and refs
    if (!container.contains(e.target)) {
      const clear = new Set();
      onSelectionChange(clear);

      // clear drag memory as well
      dragStartSelectionRef.current = new Set();
      dragAccumulatedRef.current = new Set();
    }
  };

  // global event listeners
  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleGlobalMouseDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleGlobalMouseDown);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

  // handle scroll events to update selection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isSelectingRef.current) return;
      updateSelection(); // immediate update
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [updateSelection]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-xl h-[400px] bg-gray-800 rounded-lg p-3 overflow-y-auto space-y-2 border border-gray-600 relative"
    >
      <style>{`
        .selection-box {
          position: absolute;
          background-color: rgba(76, 175, 80, 0.2);
          border: 1px solid rgb(76, 175, 80);
          pointer-events: none;
          display: none;
          z-index: 99;
        }
      `}</style>
      <div ref={selectionRef} className="selection-box"></div>
      {render(items, selectedIds)}
    </div>
  );
};

export default FileSelector;

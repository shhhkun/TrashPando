import { useState, useRef, useEffect, useCallback } from "react";

const FileSelector = ({ items, render, onSelectionChange }) => {
  const containerRef = useRef(null);
  const selectionRef = useRef(null);
  const animationFrameRef = useRef();
  const rafRef = useRef(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isCtrlKey, setIsCtrlKey] = useState(false);

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const lastMouseEventRef = useRef(null);

  const dragStartSelectionRef = useRef(new Set()); // snapshot of selection at drag start (ctrl+ drag appends to this)
  const dragAccumulatedRef = useRef(new Set()); // accumulated selection during drag (persist across scrolling)
  const isSelectingRef = useRef(false);

  // tell parent when selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds));
  }, [selectedIds]);

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
    if (!containerRef.current) return;

    const { minX, minY, maxX, maxY } = computeSelectionBounds();

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    //const newSelected = new Set(isCtrlKey ? selectedIdsRef.current : []);
    //const newSelected = new Set(isCtrlKey ? dragStartSelectionRef.current : []);

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

    // accumulate everything we've touched during this drag
    for (const id of frameIntersections) {
      dragAccumulatedRef.current.add(id);
    }

    if (!isSelectingRef.current) return; // only update during active drag

    // base: what we had at drag start if Ctrl is down, otherwise empty
    const base = isCtrlKey ? dragStartSelectionRef.current : new Set();

    // final = base ∪ accumulated (never remove during the drag)
    const next = new Set(base);
    for (const id of dragAccumulatedRef.current) next.add(id);

    setSelectedIds(next);
  }, [isCtrlKey, startPos, currentPos]);

  // continuous auto-scroll while dragging near edges
  const autoScrollLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const step = () => {
      if (!isSelectingRef.current || !containerRef.current) return;

      const e = lastMouseEventRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      const threshold = 40; // px from edge
      const vSpeed = 12; // vertical px/frame
      const hSpeed = 12; // horizontal px/frame (if you ever need horizontally scrolling lists)

      let scrolled = false;

      if (e) {
        // vertical
        if (e.clientY < rect.top + threshold) {
          container.scrollTop = Math.max(0, container.scrollTop - vSpeed);
          scrolled = true;
        } else if (e.clientY > rect.bottom - threshold) {
          container.scrollTop = Math.min(
            container.scrollHeight - container.clientHeight,
            container.scrollTop + vSpeed
          );
          scrolled = true;
        }

        // horizontal (optional; enables if your list can scroll horizontally)
        if (e.clientX < rect.left + threshold) {
          container.scrollLeft = Math.max(0, container.scrollLeft - hSpeed);
          scrolled = true;
        } else if (e.clientX > rect.right - threshold) {
          container.scrollLeft = Math.min(
            container.scrollWidth - container.clientWidth,
            container.scrollLeft + hSpeed
          );
          scrolled = true;
        }
      }

      if (scrolled) {
        // as we scroll new items enter the band; keep accumulating
        updateSelection();
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [updateSelection]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;

    //dragStartSelectionRef.current.clear();
    //dragAccumulatedRef.current.clear();

    const container = containerRef.current;
    const item = e.target.closest("[data-selectable]");
    const itemId = item?.dataset.id;

    // ctrl + click toggles selection
    if (e.ctrlKey && itemId) {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) newSet.delete(itemId);
        else newSet.add(itemId);
        return newSet;
      });
      return;
    }

    // single click selects only that item
    if (!e.ctrlKey && itemId) {
      setSelectedIds(new Set([itemId]));
      return;
    }

    if (e.target.closest("button, input, a")) return;

    // drag select anywhere in document
    setIsSelecting(true);
    isSelectingRef.current = true;
    setIsCtrlKey(e.ctrlKey);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });

    // snapshot current selection & clear accumulated for this drag

    if (e.ctrlKey) {
      dragStartSelectionRef.current = new Set(selectedIdsRef.current); // append to existing selection
    } else {
      dragStartSelectionRef.current = new Set(); // non-Ctrl: start fresh
    }
    dragAccumulatedRef.current = new Set(); // always clear accumulation

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

    autoScrollLoop(); // start continuous scroll watcher
  };

  const handleMouseMove = (e) => {
    if (!isSelecting) return;

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
    if (!isSelecting) return;
    setIsSelecting(false);
    isSelectingRef.current = false;
    document.body.style.userSelect = "";
    if (selectionRef.current) selectionRef.current.style.display = "none";
    cancelAnimationFrame(animationFrameRef.current);
  };

  const handleGlobalMouseDown = (e) => {
    const container = containerRef.current;
    if (!container) return;

    // if click is outside container, clear selection and refs
    if (!container.contains(e.target)) {
      setSelectedIds(new Set());
      dragStartSelectionRef.current.clear();
      dragAccumulatedRef.current.clear();
    }
  };

  // global event listeners
  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    //window.addEventListener("mousedown", handleGlobalMouseDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      //window.removeEventListener("mousedown", handleGlobalMouseDown);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

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

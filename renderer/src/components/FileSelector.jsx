import { useState, useRef, useEffect, useCallback } from "react";

const FileSelector = ({ items, render, selectedIds, onSelectionChange }) => {
  const containerRef = useRef(null);
  const selectionRef = useRef(null);

  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isCtrlKey, setIsCtrlKey] = useState(false);

  const dragStartSelectionRef = useRef(new Set()); // snapshot of selection at drag start (ctrl+ drag appends to this)
  const dragAccumulatedRef = useRef(new Set()); // accumulated selection during drag (persist across scrolling)

  const isSelectingRef = useRef(false);

  const scrollStartRef = useRef(0);

  const lastClickedItemRef = useRef(null);

  const dragThreshold = 5; // pixels to consider a drag
  const [isDragging, setIsDragging] = useState(false);

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

    const selectableItems = Array.from(
      containerRef.current.querySelectorAll("[data-id]")
    ).filter((item) => {
      const id = item.dataset.id;
      const file = items.find((f) => f.name === id);
      return file && !file.isDirectory; // allow only files; but empty folders are selectable via single selection
    });

    const frameIntersections = []; // to store items that intersect with the selection box

    selectableItems.forEach((item) => {
      const rect = item.getBoundingClientRect();

      const itemTop = rect.top - containerRect.top + container.scrollTop;
      const itemBottom = rect.bottom - containerRect.top + container.scrollTop;
      const itemLeft = rect.left - containerRect.left + container.scrollLeft;
      const itemRight = rect.right - containerRect.left + container.scrollLeft;

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

    // Ctrl + drag should append to existing selection, normal drag replaces
    const next = new Set(dragStartSelectionRef.current);

    frameIntersections.forEach((id) => {
      if (dragStartSelectionRef.current.has(id)) {
        // if the item was already in the initial selection, remove it
        next.delete(id);
      } else {
        // if not, add it
        next.add(id);
      }
    });

    if (!isCtrlKey) {
      // for non-Ctrl drag, just select the items in the box
      onSelectionChange(frameIntersections);
    } else {
      // for Ctrl drag, apply the toggle logic to the initial selection
      onSelectionChange(next);
    }
  }, [isCtrlKey, startPos, currentPos, onSelectionChange, items, selectedIds]);

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;

      const item = e.target.closest("[data-selectable]");
      const itemId = item?.dataset.id;
      const isUIControl = e.target.closest("button, input, a, [data-no-clear]");

      // if the click was on an interactive UI element, do nothing
      if (isUIControl) {
        return;
      }

      // set a reference to the clicked item
      lastClickedItemRef.current = itemId;

      // set up the initial state for a potential drag
      isSelectingRef.current = true;
      setIsCtrlKey(e.ctrlKey);
      setStartPos({ x: e.clientX, y: e.clientY });
      setCurrentPos({ x: e.clientX, y: e.clientY });

      // if click was on empty space (outside of FileList) with no Ctrl key, we clear the selection
      if (!itemId && !e.ctrlKey) {
        onSelectionChange(new Set());
      }

      dragStartSelectionRef.current = new Set(selectedIds);

      document.body.style.userSelect = "none";

      if (selectionRef.current) {
        Object.assign(selectionRef.current.style, {
          left: `${e.clientX}px`,
          top: `${e.clientY}px`,
          width: `0px`,
          height: `0px`,
          display: "block",
        });
      }
    },
    [onSelectionChange, selectedIds]
  );

  const handleMouseMove = (e) => {
    if (!isSelectingRef.current) return;

    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;

    if (
      (!isDragging && Math.abs(dx) > dragThreshold) ||
      Math.abs(dy) > dragThreshold
    ) {
      setIsDragging(true);
      isSelectingRef.current = true;
    }

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

  const handleMouseUp = useCallback(
    (e) => {
      if (!isSelectingRef.current) return;

      if (!isDragging) {
        if (lastClickedItemRef.current) {
          const isAlreadySelected = selectedIds.has(lastClickedItemRef.current);
          if (e.ctrlKey) {
            const newSet = new Set(selectedIds);
            if (isAlreadySelected) newSet.delete(lastClickedItemRef.current);
            else newSet.add(lastClickedItemRef.current);
            onSelectionChange(newSet);
          } else {
            if (isAlreadySelected && selectedIds.size === 1) {
              onSelectionChange(new Set());
            } else {
              onSelectionChange(new Set([lastClickedItemRef.current]));
            }
          }
        } else {
          onSelectionChange(new Set());
        }
      }

      isSelectingRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = "";
      if (selectionRef.current) selectionRef.current.style.display = "none";

      dragStartSelectionRef.current = new Set();
      dragAccumulatedRef.current.clear();
      lastClickedItemRef.current = null;
    },
    [isDragging, onSelectionChange, selectedIds]
  );

  // global event listeners
  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

  // handle scroll events to update selection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isSelectingRef.current) return;

      const scrollDelta = container.scrollTop - scrollStartRef.current;

      setCurrentPos((prev) => ({ ...prev, y: prev.y + scrollDelta }));

      scrollStartRef.current = container.scrollTop;

      updateSelection(); // immediate update
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [updateSelection]);

  return (
    <div ref={containerRef}>
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

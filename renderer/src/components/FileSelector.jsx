import { useState, useRef, useEffect, useCallback } from "react";

const FileSelector = ({ items, render, onSelectionChange }) => {
  const containerRef = useRef(null);
  const selectionRef = useRef(null);
  const animationFrameRef = useRef();

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isCtrlKey, setIsCtrlKey] = useState(false);

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  // tell parent when selection changes
  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds));
  }, [selectedIds, onSelectionChange]);

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

  const updateSelection = useCallback(() => {
    if (!selectionRef.current || !containerRef.current) return;

    const selectionRect = selectionRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const minX = selectionRect.left - containerRect.left + containerRef.current.scrollLeft;
    const maxX = selectionRect.right - containerRect.left + containerRef.current.scrollLeft;
    const minY = selectionRect.top - containerRect.top + containerRef.current.scrollTop;
    const maxY = selectionRect.bottom - containerRect.top + containerRef.current.scrollTop;

    const newSelected = new Set(isCtrlKey ? selectedIdsRef.current : []);

    const selectableItems = containerRef.current.querySelectorAll("[data-selectable]");
    selectableItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemTop = rect.top - containerRect.top + containerRef.current.scrollTop;
      const itemBottom = rect.bottom - containerRect.top + containerRef.current.scrollTop;
      const itemLeft = rect.left - containerRect.left + containerRef.current.scrollLeft;
      const itemRight = rect.right - containerRect.left + containerRef.current.scrollLeft;

      if (maxX > itemLeft && minX < itemRight && maxY > itemTop && minY < itemBottom) {
        const id = item.dataset.id;
        if (isCtrlKey && newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
      }
    });

    setSelectedIds(newSelected);
  }, [isCtrlKey]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;

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

    // drag select anywhere in document
    setIsSelecting(true);
    setIsCtrlKey(e.ctrlKey);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
    document.body.style.userSelect = "none";
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
    autoScroll(e);
  };

  const autoScroll = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const threshold = 40;
      const speed = 10;

      const scroll = () => {
        if (!isSelecting) return;
        if (e.clientY < rect.top + threshold) {
          container.scrollTop = Math.max(0, container.scrollTop - speed);
          animationFrameRef.current = requestAnimationFrame(scroll);
        } else if (e.clientY > rect.bottom - threshold) {
          container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, container.scrollTop + speed);
          animationFrameRef.current = requestAnimationFrame(scroll);
        } else {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      if (e.clientY < rect.top + threshold || e.clientY > rect.bottom - threshold) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(scroll);
      }
    },
    [isSelecting]
  );

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    document.body.style.userSelect = "";
    if (selectionRef.current) selectionRef.current.style.display = "none";
    cancelAnimationFrame(animationFrameRef.current);
  };

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

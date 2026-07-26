import { useId, useRef, useState } from "react";

type ExpandableImageItem = {
  alt: string;
  label?: string;
  src: string;
};

type ExpandableImageProps = {
  alt: string;
  className?: string;
  gallery?: ExpandableImageItem[];
  initialIndex?: number;
  loading?: "eager" | "lazy";
  src: string;
};

function ExpandIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M8.5 3.5h-5v5M15.5 3.5h5v5M20.5 15.5v5h-5M3.5 15.5v5h5" />
      <path d="m3.5 8.5 6-6M20.5 8.5l-6-6M20.5 15.5l-6 6M3.5 15.5l6 6" />
    </svg>
  );
}

export function ExpandableImage({
  alt,
  className,
  gallery,
  initialIndex = 0,
  loading = "lazy",
  src,
}: ExpandableImageProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const items = gallery?.length ? gallery : [{ alt, src }];
  const boundedInitialIndex = Math.min(
    Math.max(initialIndex, 0),
    items.length - 1,
  );
  const [activeIndex, setActiveIndex] = useState(boundedInitialIndex);
  const activeItem = items[activeIndex] ?? items[0];
  const hasMultipleItems = items.length > 1;

  function openDialog() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    setActiveIndex(boundedInitialIndex);
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function moveFrame(delta: number) {
    setActiveIndex((current) =>
      Math.min(Math.max(current + delta, 0), items.length - 1),
    );
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`Expand visual: ${alt}`}
        className="expandable-image"
        onClick={openDialog}
        type="button"
      >
        <img alt={alt} className={className} loading={loading} src={src} />
        <span className="expandable-image-affordance">
          <ExpandIcon />
          Expand visual
        </span>
      </button>
      <dialog
        aria-labelledby={titleId}
        className="expandable-image-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        onKeyDown={(event) => {
          if (!hasMultipleItems) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveFrame(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            moveFrame(1);
          }
        }}
        ref={dialogRef}
      >
        <div className="expandable-image-dialog-panel">
          <header>
            <p aria-live="polite" id={titleId}>
              {hasMultipleItems
                ? `${activeItem.label ?? "Progressive frame"} · ${activeIndex + 1} of ${items.length}`
                : "Visual detail"}
            </p>
            <div className="expandable-image-dialog-actions">
              {hasMultipleItems ? (
                <>
                  <button
                    aria-label="Show previous frame"
                    disabled={activeIndex === 0}
                    onClick={() => moveFrame(-1)}
                    type="button"
                  >
                    ← Previous
                  </button>
                  <button
                    aria-label="Show next frame"
                    disabled={activeIndex === items.length - 1}
                    onClick={() => moveFrame(1)}
                    type="button"
                  >
                    Next →
                  </button>
                </>
              ) : null}
              <button
                aria-label="Close enlarged visual"
                onClick={closeDialog}
                type="button"
              >
                Close
              </button>
            </div>
          </header>
          <div className="expandable-image-dialog-canvas">
            <img alt={activeItem.alt} src={activeItem.src} />
          </div>
        </div>
      </dialog>
    </>
  );
}

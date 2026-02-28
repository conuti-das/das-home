import { useEffect, useRef, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import "./PopupModal.css";

interface PopupModalProps {
  open: boolean;
  title: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function PopupModal({ open, title, icon, onClose, children }: PopupModalProps) {
  const mouseDownTarget = useRef<EventTarget | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleBackdropMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Only close if mousedown AND click both happened on the backdrop itself
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="popup-modal__backdrop" onMouseDown={handleBackdropMouseDown} onClick={handleBackdropClick}>
      <div className="popup-modal__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="popup-modal__header">
          {icon && (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(250,251,252,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={icon} style={{ width: 18, height: 18, color: "var(--dh-gray100)" }} />
            </div>
          )}
          <span className="popup-modal__title">{title}</span>
          <button className="popup-modal__close" onClick={onClose}>
            <Icon name="decline" style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div className="popup-modal__body">{children}</div>
      </div>
    </div>
  );
}

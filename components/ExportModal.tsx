"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Doc, Palette } from "@/lib/tokens";
import { generateTsx, getFrameAndItems } from "@/lib/codegen";
import { Icon } from "./M3Node";
import { IconBtn } from "./ui";

export interface ExportModalProps {
  doc: Doc;
  frameId?: string;
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  palette: Palette;
}

export function ExportModal({
  doc,
  frameId,
  isOpen,
  open: legacyOpen,
  onClose,
  palette: p,
}: ExportModalProps) {
  const visible = isOpen ?? legacyOpen ?? false;
  const [copied, setCopied] = useState(false);

  const { frame } = useMemo(() => getFrameAndItems(doc, frameId), [doc, frameId]);
  const code = useMemo(() => generateTsx(doc, frameId), [doc, frameId]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!visible) return;
    setCopied(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [visible, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="export-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 600,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Export TSX"
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 480, damping: 34, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(100%, 740px)",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              borderRadius: 24,
              background: p.surfaceContainerHigh,
              color: p.onSurface,
              boxShadow: "0 16px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)",
              padding: "20px 24px 24px",
              border: `1px solid ${p.outlineVariant}40`,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                paddingBottom: 16,
                borderBottom: `1px solid ${p.outlineVariant}30`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: p.primaryContainer,
                    color: p.onPrimaryContainer,
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                  }}
                >
                  <Icon name="code" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                    Export TSX
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: p.onSurfaceVariant, marginTop: 2 }}>
                    {frame ? `React component for “${frame.name || "Frame"}”` : "React TSX for canvas components"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy TSX code to clipboard"
                  className="m3-press"
                  style={{
                    height: 38,
                    padding: "0 16px",
                    borderRadius: 19,
                    border: "none",
                    background: copied ? p.tertiaryContainer : p.primary,
                    color: copied ? p.onTertiaryContainer : p.onPrimary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "background-color 0.2s, color 0.2s",
                  }}
                >
                  <Icon name={copied ? "check" : "content_copy"} size={17} />
                  {copied ? "Copied!" : "Copy TSX"}
                </button>

                <IconBtn
                  icon="close"
                  p={p}
                  onClick={onClose}
                  title="Close (Esc)"
                  size={38}
                />
              </div>
            </div>

            {/* Code Block Container */}
            <div
              style={{
                position: "relative",
                flex: 1,
                minHeight: 0,
                marginTop: 16,
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "#18181b",
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.35)",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  padding: "18px 20px",
                  color: "#f4f4f5",
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 13,
                  lineHeight: 1.65,
                  overflow: "auto",
                  maxHeight: "56vh",
                  whiteSpace: "pre",
                }}
              >
                <code>{code}</code>
              </pre>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 14,
                paddingTop: 10,
                fontSize: 12,
                color: p.onSurfaceVariant,
              }}
            >
              <span>Idiomatic React TSX with shadcn/ui components.</span>
              <button
                type="button"
                onClick={onClose}
                className="m3-press"
                style={{
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 16,
                  border: `1px solid ${p.outlineVariant}50`,
                  background: "transparent",
                  color: p.onSurface,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ExportModal;

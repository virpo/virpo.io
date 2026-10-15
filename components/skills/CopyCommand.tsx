"use client";

import { useEffect, useRef, useState } from "react";

export function CopyCommand({ command, label }: { command: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // Clipboard can be blocked; select the text so a manual copy is one keystroke.
      const node = codeRef.current;
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="skillInstall">
      <code ref={codeRef}>
        {command.split(" ").map((part, index) => (
          <span key={index}>
            {index > 0 ? " " : null}
            <span className="skillInstallToken">{part}</span>
          </span>
        ))}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `Copied ${label} install command` : `Copy ${label} install command`}
        data-copied={copied || undefined}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="visuallyHidden" role="status">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}

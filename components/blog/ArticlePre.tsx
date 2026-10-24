"use client";

import { isValidElement, useRef, useState, type ReactElement, type ReactNode } from "react";
import { track } from "../site/Analytics";

const textOf = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
};

/** Code blocks and prompt cards in posts, each with a Copy button. Copies are counted in PostHog. */
export function ArticlePre({ children }: { children?: ReactNode }) {
  const code = isValidElement(children) ? (children as ReactElement<{ className?: string; children?: ReactNode }>) : null;
  const language = /language-(\w+)/.exec(code?.props.className ?? "")?.[1] ?? "text";
  const text = textOf(code?.props.children ?? children).replace(/\n$/, "");
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const prompt = language === "prompt";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
    track(prompt ? "prompt_copied" : "code_copied", { path: location.pathname, language, preview: text.slice(0, 80) });
  };

  return (
    <div className={`articleCode${prompt ? " articlePrompt" : ""}`} data-language={language}>
      <div className="articleCodeBar">
        <span>{prompt ? "Prompt" : language === "sh" ? "Terminal" : language}</span>
        <button type="button" onClick={copy} aria-label={copied ? "Copied" : prompt ? "Copy this prompt" : "Copy this code"} data-copied={copied || undefined}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  );
}

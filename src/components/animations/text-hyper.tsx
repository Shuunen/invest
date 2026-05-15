// oxlint-disable id-length, no-magic-numbers, no-nested-ternary
import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/browser-styles";

// Source : https://www.componentry.fun/docs/components/hyper-text

type HyperTextProps = {
  className?: string;
  duration?: number;
  text: string;
  animateOnLoad?: boolean;
};

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const TextHyper = ({ className, duration = 800, text, animateOnLoad = true }: HyperTextProps) => {
  const [displayText, setDisplayText] = useState(text.split(""));
  const [trigger, setTrigger] = useState(false);
  const iterations = useRef(0);
  const isFirstRender = useRef(true);

  const triggerAnimation = () => {
    iterations.current = 0;
    setTrigger(true);
  };

  useEffect(() => {
    iterations.current = 0;
    setDisplayText(text.split(""));
    const interval = setInterval(
      () => {
        if (!animateOnLoad && isFirstRender.current) {
          clearInterval(interval);
          isFirstRender.current = false;
          return;
        }
        if (iterations.current < text.length) {
          setDisplayText(t => t.map((l, i) => (l === " " ? l : i <= iterations.current ? (text[i] ?? "") : alphabets[Math.floor(Math.random() * alphabets.length)])));
          iterations.current += 0.1;
        } else {
          setTrigger(false);
          clearInterval(interval);
        }
      },
      duration / (text.length * 10),
    );
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [text, duration, trigger, animateOnLoad]);

  return (
    <div className={cn("flex cursor-default overflow-hidden py-2 font-mono", className)} onMouseEnter={triggerAnimation}>
      {displayText.map((letter, i) => (
        <span key={i} className="min-w-[0.1em]">
          {letter}
        </span>
      ))}
    </div>
  );
};

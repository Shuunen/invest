import { kebabCase } from "es-toolkit";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "../utils/browser-styles";
import { nbMsInSecond } from "../utils/constants";
import { formatNumber } from "../utils/format-numbers";
import { TextHyper } from "./animations/text-hyper";

export type MetricItem = {
  color: "success" | "neutral" | "error" | "warning" | "info";
  label: string | number;
  value: string | number | undefined;
};

const metricColorClass: Record<MetricItem["color"], string> = {
  error: "text-error",
  info: "text-info",
  neutral: "text-base-content",
  success: "text-success",
  warning: "text-warning",
};

export function Metric({ color, label, value, index = 0 }: MetricItem & { index?: number }) {
  const displayValue = typeof value === "number" ? formatNumber(value) : (value ?? "—");
  const testAnimationDuration = 1;
  const defaultAnimationDuration = 300;
  const animationDuration = import.meta.env.MODE === "test" ? testAnimationDuration : defaultAnimationDuration;
  const [ready, setReady] = useState(import.meta.env.MODE === "test" || index === 0);

  useEffect(() => {
    if (index === 0) return undefined;
    const timer = setTimeout(() => setReady(true), index * animationDuration);
    return () => clearTimeout(timer);
  }, [animationDuration, index]);

  return (
    // oxlint-disable-next-line id-length
    <motion.div className="flex flex-col" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index * animationDuration) / nbMsInSecond, duration: animationDuration / nbMsInSecond }}>
      <span data-testid={`metric-${kebabCase(String(label))}-value`} className={cn(`font-mono font-bold tracking-tight md:text-xl`, metricColorClass[color])}>
        {ready && <TextHyper text={displayValue} duration={animationDuration} />}
      </span>
      <span data-testid={`metric-${kebabCase(String(label))}-label`} className="text-xs font-medium tracking-widest text-base-content/40 uppercase">
        {label}
      </span>
    </motion.div>
  );
}

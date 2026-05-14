// oxlint-disable react/forbid-component-props, id-length, unicorn/no-nested-ternary, no-duplicate-imports, max-lines-per-function
import type { MotionProps, Variants } from "framer-motion";
import { AnimatePresence, motion, useInView } from "framer-motion";
import type { ElementType } from "react";
import { useRef } from "react";
import { cn } from "../../utils/browser-styles";

// Source : https://www.componentry.fun/docs/components/text-animate

type AnimationType = "fadeIn" | "blurIn" | "blurInUp" | "blurInDown" | "slideUp" | "slideDown" | "slideLeft" | "slideRight" | "scaleUp" | "scaleDown";

type TextAnimateProps = {
  /**
   * The text to animate
   */
  children: string;
  /**
   * The class name for the wrapper element
   */
  className?: string;
  /**
   * The class name for the segmented elements (words or characters)
   */
  segmentClassName?: string;
  /**
   * The base component to use for the wrapper
   */
  as?: ElementType;
  /**
   * The base delay for the animation
   */
  delay?: number;
  /**
   * The duration of the animation per item
   */
  duration?: number;
  /**
   * The type of animation to perform
   */
  animation?: AnimationType;
  /**
   * How to split the text
   */
  by?: "text" | "word" | "character";
  /**
   * Whether to start the animation when the element comes into view
   */
  startOnView?: boolean;
  /**
   * Whether to run the animation only once
   */
  once?: boolean;
} & MotionProps;

export function TextAnimate({ children, delay = 0, duration = 0.3, className, segmentClassName, as: Component = "p", startOnView = true, once = true, by = "word", animation = "fadeIn", ...props }: TextAnimateProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once });

  const segments = by === "character" ? children.split("") : by === "word" ? children.split(" ") : [children];

  const containerVariants: Variants = {
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Record<AnimationType, Variants> = {
    blurIn: {
      hidden: { filter: "blur(10px)", opacity: 0 },
      show: {
        filter: "blur(0px)",
        opacity: 1,
        transition: { duration },
      },
    },
    blurInDown: {
      hidden: { filter: "blur(10px)", opacity: 0, y: -20 },
      show: {
        filter: "blur(0px)",
        opacity: 1,
        transition: { duration },
        y: 0,
      },
    },
    blurInUp: {
      hidden: { filter: "blur(10px)", opacity: 0, y: 20 },
      show: {
        filter: "blur(0px)",
        opacity: 1,
        transition: { duration },
        y: 0,
      },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { duration },
      },
    },
    scaleDown: {
      hidden: { opacity: 0, scale: 1.5 },
      show: {
        opacity: 1,
        scale: 1,
        transition: { duration },
      },
    },
    scaleUp: {
      hidden: { opacity: 0, scale: 0.5 },
      show: {
        opacity: 1,
        scale: 1,
        transition: { duration },
      },
    },
    slideDown: {
      hidden: { opacity: 0, y: -20 },
      show: {
        opacity: 1,
        transition: { duration },
        y: 0,
      },
    },
    slideLeft: {
      hidden: { opacity: 0, x: 20 },
      show: {
        opacity: 1,
        transition: { duration },
        x: 0,
      },
    },
    slideRight: {
      hidden: { opacity: 0, x: -20 },
      show: {
        opacity: 1,
        transition: { duration },
        x: 0,
      },
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      show: {
        opacity: 1,
        transition: { duration },
        y: 0,
      },
    },
  };

  const finalVariants = itemVariants[animation];

  // Use the 'as' prop to dynamically render the motion component
  const MotionComponent = motion.create(Component);

  return (
    <AnimatePresence mode="popLayout">
      <MotionComponent ref={ref} className={cn("whitespace-pre-wrap", className)} initial="hidden" animate={startOnView ? (isInView ? "show" : "hidden") : "show"} exit="exit" variants={containerVariants} {...props}>
        {segments.map((segment, i) => (
          <motion.span key={`${by}-${i}-${segment}`} className={cn("inline-block", segmentClassName)} variants={finalVariants}>
            {segment}
            {by === "word" && i < segments.length - 1 && <span className="inline-block">&nbsp;</span>}
          </motion.span>
        ))}
      </MotionComponent>
    </AnimatePresence>
  );
}

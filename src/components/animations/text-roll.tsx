// oxlint-disable id-length
import { motion } from "framer-motion";
import React from "react";

// source : https://skiper-ui.com/v1/skiper58

const stagger = 0.035;
const centerDivisor = 2;

type Props = {
  children: string;
  center?: boolean;
};

const TextRoll: React.FC<Props> = ({ children, center = false }) => {
  const centerIndex = (children.length - 1) / centerDivisor;
  const getDelay = (index: number) => (center ? stagger * Math.abs(index - centerIndex) : stagger * index);

  const renderAnimatedChars = (initialY: number | string, hoveredY: number | string) =>
    children.split("").map((character, index) => (
      <motion.span
        variants={{
          hovered: {
            y: hoveredY,
          },
          initial: {
            y: initialY,
          },
        }}
        transition={{
          delay: getDelay(index),
          ease: "easeInOut",
        }}
        className="inline-block"
        key={index}
      >
        {character}
      </motion.span>
    ));

  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className="relative block overflow-hidden"
      style={{
        lineHeight: 0.75,
      }}
    >
      <div>{renderAnimatedChars(0, "-100%")}</div>
      <div className="absolute inset-0">{renderAnimatedChars("100%", 0)}</div>
    </motion.span>
  );
};

export { TextRoll };

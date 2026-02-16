"use client";
import { motion, MotionProps } from "motion/react";
import { ReactNode } from "react";

type AnimationDirection = "left" | "right" | "up" | "down";

const getAnimationValues = (direction: AnimationDirection) => {
  const distance = 60;

  switch (direction) {
    case "left":
      return { enter: -distance, exit: distance };
    case "right":
      return { enter: distance, exit: -distance };
    case "up":
      return { enter: distance, exit: -distance };
    case "down":
      return { enter: -distance, exit: distance };
  }
};

interface AnimatedSectionProps extends MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: AnimationDirection;
  duration?: number;
}

const AnimatedSection = ({
  children,
  className,
  delay = 0,
  direction = "right",
  duration = 0.4,
  ...props
}: AnimatedSectionProps) => {
  const { enter, exit } = getAnimationValues(direction);
  const isVertical = direction === "up" || direction === "down";

  const defaultAnimationProps = {
    initial: {
      opacity: 0,
      [isVertical ? "y" : "x"]: enter,
      scale: 0.96,
    },
    animate: {
      opacity: 1,
      [isVertical ? "y" : "x"]: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      [isVertical ? "y" : "x"]: exit,
      scale: 0.96,
    },
    transition: {
      duration,
      ease: [0.25, 0.1, 0.25, 1], // Smooth easing curve
      delay,
    },
  };

  const customProps = {
    ...defaultAnimationProps,
    ...props,
    transition: {
      ...defaultAnimationProps.transition,
      ...(props.transition as object),
    },
  };

  return (
    <motion.div
      className={className}
      initial={customProps.initial}
      animate={customProps.animate}
      exit={customProps.exit}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transition={customProps.transition as any}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
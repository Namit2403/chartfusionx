import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Ghost } from "lucide-react";

import { FlowButton } from "@/components/ui/flow-button";

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.43, 0.13, 0.23, 0.96] as const,
      delayChildren: 0.1,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] as const },
  },
};

const numberVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction * 40,
    y: 15,
    rotate: direction * 5,
  }),
  visible: {
    opacity: 0.7,
    x: 0,
    y: 0,
    rotate: 0,
    transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] as const },
  },
};

const ghostVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 15, rotate: -5 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] as const },
  },
  hover: {
    scale: 1.1,
    y: -10,
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut" as const,
      rotate: {
        duration: 2,
        ease: "linear" as const,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  },
  floating: {
    y: [-5, 5],
    transition: {
      y: {
        duration: 2,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  },
};

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center px-4 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="panel grid-lines w-full max-w-xl px-8 py-14 text-center"
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-3"
        >
          <motion.span
            custom={-1}
            variants={numberVariants}
            className="num text-7xl font-semibold text-foreground sm:text-8xl"
          >
            4
          </motion.span>

          <motion.div
            variants={ghostVariants}
            initial="hidden"
            animate={["visible", "floating"]}
            whileHover="hover"
            className="flex size-20 items-center justify-center rounded-full border border-border bg-surface-2 sm:size-24"
          >
            <Ghost className="size-10 text-muted-foreground sm:size-12" strokeWidth={1.5} />
          </motion.div>

          <motion.span
            custom={1}
            variants={numberVariants}
            className="num text-7xl font-semibold text-foreground sm:text-8xl"
          >
            4
          </motion.span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-8 text-2xl font-semibold tracking-tight text-foreground"
        >
          Boo! Page missing!
        </motion.h1>

        <motion.p variants={itemVariants} className="mt-3 text-sm text-muted-foreground">
          Whoops! This page must be a ghost — it&apos;s not here.
        </motion.p>

        <motion.div variants={itemVariants} className="mt-8 flex justify-center">
          <Link to="/">
            <FlowButton text="Back to dashboard" />
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6">
          <Link
            to="/whats-coming"
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            What&apos;s coming next
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

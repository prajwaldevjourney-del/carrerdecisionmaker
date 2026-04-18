"use client";

import { motion } from "framer-motion";
import { PAGE } from "@/lib/motion";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...PAGE}>
      {children}
    </motion.div>
  );
}

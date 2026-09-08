import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

import logo from "@/assets/cfx-logo.png";
import dashboardShot from "@/assets/hero-dashboard.jpg";
import avatar from "@/assets/testimonial-avatar.jpg";

const TESTIMONIAL =
  "ChartFusionX changed how I review my trading week. Every entry, exit and mistake is in one place, and the numbers finally tell me what my execution actually looks like instead of what I remember.";

/** Full-bleed dark landing hero + scroll-reveal testimonial for signed-out visitors. */
export function LandingHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const shotY = useTransform(scrollYProgress, [0, 1], [0, -250]);

  return (
    <div
      className="landing-dark relative w-screen bg-black text-white"
      style={{ marginLeft: "calc(-50vw + 50%)" }}
    >
      <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-4 md:px-28">
          <div className="flex items-center gap-12 md:gap-20">
            <div className="flex items-center gap-2">
              <img src={logo} alt="" width={28} height={28} className="size-7 object-contain" />
              <span className="text-xl font-bold tracking-tight">ChartFusionX</span>
            </div>
            <div className="hidden items-center gap-1 text-sm text-white/65 md:flex">
              <Link to="/" className="rounded-md px-3 py-1.5 hover:text-white">
                Home
              </Link>
              <Link
                to="/whats-coming"
                className="flex items-center gap-1 rounded-md px-3 py-1.5 hover:text-white"
              >
                Features <ChevronDown className="size-4" />
              </Link>
              <Link to="/pricing" className="rounded-md px-3 py-1.5 hover:text-white">
                Free beta
              </Link>
              <Link to="/signup" className="rounded-md px-3 py-1.5 hover:text-white">
                Get started
              </Link>
            </div>
          </div>
          <Link
            to="/auth"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-85"
          >
            Sign In
          </Link>
        </nav>

        {/* Hero copy */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="mt-16 flex flex-col items-center px-4 text-center md:mt-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="liquid-glass mb-6 flex items-center gap-2 rounded-lg px-3 py-2"
          >
            <span className="rounded-md bg-white px-2 py-0.5 text-sm font-medium text-black">
              New
            </span>
            <span className="text-sm font-medium text-white/65">
              ChartFusionX is free during beta
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-3 text-5xl font-medium leading-tight tracking-[-2px] md:text-7xl md:leading-[1.15]"
          >
            Your Trades.
            <br />
            One Clear <span className="font-serif font-normal italic">Overview</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 text-lg font-normal leading-6 text-white/90 opacity-90"
          >
            ChartFusionX turns the trades you log into an equity curve, win rate
            <br />
            and a clear read on your own execution.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/signup"
                className="inline-block rounded-full bg-white px-8 py-3.5 text-base font-medium text-black"
              >
                Get Started for Free
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Dashboard area */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mt-14 w-full"
          style={{ aspectRatio: "16 / 9" }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,255,255,0.14),transparent_70%)]" />
          <motion.img
            src={dashboardShot}
            alt="ChartFusionX performance dashboard showing an equity curve and trade statistics"
            width={1600}
            height={1000}
            style={{ y: shotY, mixBlendMode: "luminosity" }}
            className="absolute left-1/2 top-6 w-[90%] max-w-5xl -translate-x-1/2 rounded-2xl border border-white/15"
          />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-40 bg-gradient-to-t from-black to-transparent" />
        </motion.div>
      </section>

      <Testimonial />
    </div>
  );
}

function Testimonial() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end center"],
  });
  const words = TESTIMONIAL.split(" ");

  return (
    <section className="flex min-h-screen items-center px-8 py-24 md:px-28 md:py-32">
      <div ref={containerRef} className="mx-auto flex max-w-3xl flex-col items-start gap-10">
        <span className="font-serif text-6xl leading-none text-white/70">&ldquo;</span>

        <p className="flex flex-wrap text-4xl font-medium leading-[1.2] md:text-5xl">
          {words.map((word, i) => (
            <Word
              key={`${word}-${i}`}
              word={word}
              progress={scrollYProgress}
              range={[i / words.length, (i + 1) / words.length]}
            />
          ))}
          <span className="ml-2 text-white/65">&rdquo;</span>
        </p>

        <div className="flex items-center gap-4">
          <img
            src={avatar}
            alt=""
            loading="lazy"
            width={56}
            height={56}
            className="size-14 rounded-full border-[3px] border-white object-cover"
          />
          <div>
            <div className="text-base font-semibold leading-7 text-white">Marcus Oyelade</div>
            <div className="text-sm font-normal leading-5 text-white/65">
              Beta tester · Futures trader
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Word({
  word,
  progress,
  range,
}: {
  word: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  const color = useTransform(progress, range, ["hsl(0 0% 35%)", "hsl(0 0% 100%)"]);
  return (
    <motion.span style={{ opacity, color }} className="mr-[0.3em]">
      {word}
    </motion.span>
  );
}

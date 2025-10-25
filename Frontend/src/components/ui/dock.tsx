"use client";

import React, { PropsWithChildren, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  magnification?: number;
  distance?: number;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const dockVariants = cva(
  "mx-auto w-max mt-8 h-[140px] p-6 flex gap-24 rounded-3xl border supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 backdrop-blur-md"
);

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      magnification = DEFAULT_MAGNIFICATION,
      distance = DEFAULT_DISTANCE,
      direction = "bottom",
      ...props
    },
    ref
  ) => {
    const mouseX = useMotionValue(Infinity);

    const renderChildren = () => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            mouseX: mouseX,
            magnification: magnification,
            distance: distance,
          } as any);
        }
        return child;
      });
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockVariants({ className }), {
          "items-start": direction === "top",
          "items-center": direction === "middle",
          "items-end": direction === "bottom",
        })}
      >
        {renderChildren()}
      </motion.div>
    );
  }
);

Dock.displayName = "Dock";

export interface DockIconProps {
  size?: number;
  magnification?: number;
  distance?: number;
  mouseX?: any;
  className?: string;
  children?: React.ReactNode;
  props?: PropsWithChildren;
}

const DockIcon = ({
  size,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  ...props
}: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [110, magnification, 110]
  );

  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

DockIcon.displayName = "DockIcon";

export interface DockItemProps extends VariantProps<typeof dockVariants> {
  className?: string;
  children?: React.ReactNode;
  mouseX?: any;
  magnification?: number;
  distance?: number;
}

const DockItem = React.forwardRef<HTMLDivElement, DockItemProps>(
  ({ className, children, mouseX, magnification, distance, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative group", className)} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === DockIcon) {
            return React.cloneElement(child, {
              ...child.props,
              mouseX: mouseX,
              magnification: magnification,
              distance: distance,
            } as any);
          }
          return child;
        })}
      </div>
    );
  }
);

DockItem.displayName = "DockItem";

const DockLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={cn(
        "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none",
        className
      )}
    >
      {children}
    </div>
  );
};

DockLabel.displayName = "DockLabel";

export { Dock, DockIcon, DockItem, DockLabel, dockVariants };

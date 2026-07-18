"use client";

import { Component, type ReactNode } from "react";

/**
 * AnimationBoundary — error boundary for animation components.
 *
 * E8: If GSAP or Framer Motion fails (plugin not loaded, DOM mismatch,
 * SSR hydration issue), this catches the error and renders children
 * in a static, non-animated state instead of crashing the page.
 *
 * Usage:
 *   <AnimationBoundary>
 *     <SplitTextReveal>...</SplitTextReveal>
 *   </AnimationBoundary>
 */

interface Props {
  children: ReactNode;
  /** Optional fallback to render on error (defaults to rendering children without animation) */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AnimationBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log animation errors in development only
    if (process.env.NODE_ENV === "development") {
      console.warn("[AnimationBoundary] Animation component crashed:", error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback or just the children in a static wrapper
      return this.props.fallback ?? (
        <div style={{ opacity: 1 }}>
          {this.props.children}
        </div>
      );
    }

    return this.props.children;
  }
}

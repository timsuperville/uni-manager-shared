import { useState, useEffect, useRef, RefObject } from "react";

interface Args extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver<T extends Element>({
  threshold = 0,
  root = null,
  rootMargin = "0%",
  freezeOnceVisible = true,
}: Args = {}): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isIntersecting, setIntersecting] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isIntersecting && freezeOnceVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIntersecting(entry.isIntersecting);
      },
      { threshold, root, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, isIntersecting]);

  return [ref, isIntersecting];
}

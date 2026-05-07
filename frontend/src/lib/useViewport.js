import { useEffect, useState } from "react";

function getWidth() {
  if (typeof window === "undefined") {
    return 1280;
  }

  return window.innerWidth;
}

function useViewport() {
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isTablet: width <= 960,
    isMobile: width <= 720,
  };
}

export default useViewport;

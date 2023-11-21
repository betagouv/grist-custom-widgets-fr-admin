import { DependencyList, EffectCallback, useEffect, useState } from "react";

const GRIST_MAX_ATTEMPTS = 10;
const GRIST_ATTEMPT_INTERVAL_MS = 1000;

const useIsGristAvailable = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let counter = 0;
    const checkGrist = () => {
      if (typeof grist !== "undefined") {
        setIsAvailable(true);
      } else {
        counter++;
        if (counter < GRIST_MAX_ATTEMPTS) {
          setTimeout(checkGrist, GRIST_ATTEMPT_INTERVAL_MS);
        } else {
          setIsAvailable(false);
          console.error(`Grist is not available (tried ${counter} times)`);
        }
      }
    };
    checkGrist();
  }, []);
  return isAvailable;
};

export const useGristEffect = (fn: EffectCallback, deps?: DependencyList) => {
  const isAvailable = useIsGristAvailable();
  return useEffect(() => {
    if (isAvailable) {
      fn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAvailable, fn, ...(deps ? deps : [])]);
};

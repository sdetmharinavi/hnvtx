import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CnFunction {
  (...args: Parameters<typeof clsx>): string;
}

export const cn: CnFunction = (...args) => {
  return twMerge(clsx(...args));
};

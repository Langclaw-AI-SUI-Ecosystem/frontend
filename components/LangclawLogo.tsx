import { cn } from "@/lib/utils";

type LangclawLogoProps = {
  className?: string;
};

const CLAW_POINTS = [
  "9,88 9,55 18,43 27,55 27,88",
  "41,88 41,40 50,28 59,40 59,88",
  "73,88 73,25 82,13 91,25 91,88",
];

export function LangclawLogo({ className }: LangclawLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("block size-9", className)}
      fill="none"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#3b82f6" height="512" rx="105" width="512" />
      <g fill="#ffffff" transform="translate(68.68,66.81) scale(3.7463)">
        {CLAW_POINTS.map((points) => (
          <polygon key={points} points={points} />
        ))}
      </g>
    </svg>
  );
}

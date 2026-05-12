type MariLogoProps = {
  className?: string;
  title?: string;
};

export function MariLogo({ className, title = "Mari Beauty" }: MariLogoProps) {
  return (
    <svg
      viewBox="0 0 120 140"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path
        d="M14 122
           C 18 96, 24 70, 32 44
           C 35 34, 40 22, 46 18
           C 50 16, 54 19, 56 26
           C 58 34, 58 46, 56 60
           C 54 76, 50 92, 48 108
           C 47 116, 49 119, 53 116
           C 58 112, 64 100, 70 86
           C 76 70, 82 54, 88 42
           C 92 34, 96 28, 100 28
           C 104 28, 105 34, 104 44
           C 102 60, 96 82, 92 102
           C 90 112, 90 120, 94 122
           C 98 124, 104 120, 110 112"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MariLogo;

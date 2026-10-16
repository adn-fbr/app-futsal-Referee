import ffiLogo from "@/assets/ffi-logo.png";

interface FFILogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

const sizeClasses = {
  sm: "w-20",
  md: "w-32",
  lg: "w-40",
};

export function FFILogo({ size = "md", showSubtitle = true }: FFILogoProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={ffiLogo}
        alt="Federasi Futsal Indonesia"
        className={`${sizeClasses[size]} h-auto object-contain`}
      />
      {showSubtitle && (
        <p className="text-sm font-medium text-muted-foreground tracking-wide">
          Sulawesi Selatan
        </p>
      )}
    </div>
  );
}

// Re-export with old name for backward compatibility
export { FFILogo as FFSSLogo };

import Link from "next/link";
import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
  theme?: "light" | "dark" | "auto";
}

export default function BrandLogo({
  size = "md",
  showText = true,
  subtitle,
  href,
  className = "",
  theme = "light",
}: BrandLogoProps) {
  const sizeMap = {
    sm: {
      box: "h-8 w-8 rounded-lg",
      img: 24,
      title: "text-sm",
      sub: "text-[10px]",
    },
    md: {
      box: "h-10 w-10 rounded-xl",
      img: 32,
      title: "text-base",
      sub: "text-xs",
    },
    lg: {
      box: "h-13 w-13 rounded-2xl",
      img: 42,
      title: "text-xl",
      sub: "text-xs",
    },
    xl: {
      box: "h-16 w-16 rounded-2xl",
      img: 52,
      title: "text-2xl",
      sub: "text-sm",
    },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Logo Icon Box with sleek gradient border & subtle shadow */}
      <div
        className={`relative flex items-center justify-center p-1.5 flex-shrink-0 transition-transform duration-200 hover:scale-105 ${
          currentSize.box
        } ${
          theme === "dark"
            ? "bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/60 shadow-lg shadow-black/40"
            : "bg-white border border-slate-200/90 shadow-sm shadow-indigo-100"
        }`}
      >
        <Image
          src="/task_logo.png"
          alt="TaskFlow Logo"
          width={currentSize.img}
          height={currentSize.img}
          className="object-contain drop-shadow-sm select-none"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-tight leading-none ${
              currentSize.title
            } ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            Task<span className="text-indigo-600">Flow</span>
          </span>
          {subtitle && (
            <span
              className={`font-medium tracking-normal mt-1 leading-none ${
                currentSize.sub
              } ${theme === "dark" ? "text-zinc-400" : "text-slate-500"}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}


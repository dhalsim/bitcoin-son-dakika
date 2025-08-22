import { Link } from "react-router";

import { cn } from "@/lib/utils";

interface CategoryTagsProps {
  tags?: string[];
  className?: string;
  tagClassName?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function CategoryTags({
  tags,
  className = "",
  tagClassName = "",
  size = "xs",
}: CategoryTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "px-2 py-1 text-xs";
      case "sm":
        return "px-3 py-1.5 text-sm";
      case "md":
        return "px-4 py-2 text-sm";
      case "lg":
        return "px-6 py-3 text-base";
      default:
        return "px-4 py-2 text-sm";
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* Tags */}
      {tags.length > 0 && (
        <>
          {tags.map((tag, index) => (
            <Link
              key={index}
              to={`/tag/${tag}`}
              className={cn(
                "bg-main-accent text-black px-3 py-1 rounded-full text-sm font-medium hover:bg-main-accent/80 transition-colors",
                getSizeClasses(),
                tagClassName,
              )}
            >
              #{tag}
            </Link>
          ))}
        </>
      )}
    </div>
  );
}

export default CategoryTags;

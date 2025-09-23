import { Link } from "react-router";

import { cn, links } from "@/lib/utils";

import { type TagItem } from "../../api-helpers/common_with_client";

interface CategoryTagsProps {
  tagItems: TagItem[];
  className?: string;
  tagClassName?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function CategoryTags({
  tagItems,
  className = "",
  tagClassName = "",
  size = "xs",
}: CategoryTagsProps) {
  if (!tagItems || tagItems.length === 0) {
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
      {tagItems.length > 0 && (
        <>
          {tagItems.map((tagItem, index) => (
            <Link
              key={index}
              to={links.tag(tagItem.tag)}
              className={cn(
                "bg-main-accent text-black px-3 py-1 rounded-full text-sm font-medium hover:bg-main-accent/80 transition-colors",
                getSizeClasses(),
                tagClassName,
              )}
            >
              #{tagItem.label}
            </Link>
          ))}
        </>
      )}
    </div>
  );
}

export default CategoryTags;

import { Link } from "react-router";

import { cn } from "@/lib/utils";

interface CategoryTagsProps {
  tags?: string[];
  className?: string;
  tagClassName?: string;
}

export function CategoryTags({ tags, className = "", tagClassName = "" }: CategoryTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

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
                "bg-main-accent text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-main-accent-dark transition-colors",
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

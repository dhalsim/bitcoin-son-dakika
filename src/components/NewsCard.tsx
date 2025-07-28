import React from "react";
import { Link } from "react-router";

import { createProfileSlug } from "../lib/ssg-data";

import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface NewsCardProps {
  title: string;
  summary: string;
  category: string;
  time: string;
  image?: string;
  featured?: boolean;
  author?: {
    display_name?: string;
    picture?: string;
  };
}

const NewsCard: React.FC<NewsCardProps> = ({
  title,
  summary,
  category,
  time,
  image,
  featured = false,
  author,
}) => {
  return (
    <article
      className={`bg-white dark:bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${featured ? "h-full" : ""} dark:border dark:border-border`}
    >
      {image && (
        <div
          className={`relative ${featured ? "h-48 sm:h-64" : "h-40 sm:h-48"}`}
        >
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
            <span className="bg-main-accent text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              {category}
            </span>
          </div>
        </div>
      )}

      <div className={`p-${featured ? "4 sm:p-6" : "3 sm:p-4"}`}>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>{time}</span>
          {author && author.display_name && (
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                {author.picture ? (
                  <AvatarImage
                    src={author.picture}
                    alt={author.display_name || ""}
                  />
                ) : null}
                <AvatarFallback className="text-xs">
                  {author.display_name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <Link
                to={`/profile/${createProfileSlug(author.display_name)}`}
                className="text-gray-600 dark:text-gray-400 font-medium hover:text-main-accent transition-colors"
              >
                {author.display_name}
              </Link>
            </div>
          )}
        </div>

        <h3
          className={`font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 hover:text-main-accent transition-colors cursor-pointer ${
            featured
              ? "text-lg sm:text-xl leading-tight"
              : "text-base sm:text-lg leading-tight"
          }`}
        >
          {title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
          {summary}
        </p>
      </div>
    </article>
  );
};

export default NewsCard;

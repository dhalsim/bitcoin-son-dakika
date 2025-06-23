
import React from 'react';

interface NewsCardProps {
  title: string;
  summary: string;
  category: string;
  time: string;
  image?: string;
  featured?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  title, 
  summary, 
  category, 
  time, 
  image, 
  featured = false 
}) => {
  return (
    <article className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 ${featured ? 'h-full' : ''}`}>
      {image && (
        <div className={`relative ${featured ? 'h-48 sm:h-64' : 'h-40 sm:h-48'}`}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-red-600 text-white px-2 py-1 text-xs font-medium uppercase tracking-wide">
              {category}
            </span>
          </div>
        </div>
      )}
      
      <div className={`p-${featured ? '4 sm:p-6' : '3 sm:p-4'}`}>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          <span>{time}</span>
        </div>
        
        <h3 className={`font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer leading-tight ${
          featured ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
        }`}>
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
          {summary}
        </p>
      </div>
    </article>
  );
};

export default NewsCard;

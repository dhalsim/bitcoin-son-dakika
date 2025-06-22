
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
    <article className={`bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${featured ? 'h-full' : ''}`}>
      {image && (
        <div className={`relative ${featured ? 'h-64' : 'h-48'}`}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-[#F7931A] text-white px-3 py-1 rounded-full text-sm font-medium">
              {category}
            </span>
          </div>
        </div>
      )}
      
      <div className={`p-${featured ? '6' : '4'}`}>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>{time}</span>
        </div>
        
        <h3 className={`font-bold text-gray-900 dark:text-gray-100 mb-3 hover:text-[#F7931A] transition-colors cursor-pointer ${
          featured ? 'text-xl leading-tight' : 'text-lg leading-tight'
        }`}>
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {summary}
        </p>
      </div>
    </article>
  );
};

export default NewsCard;

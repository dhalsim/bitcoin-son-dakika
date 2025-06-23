
import React from 'react';

const PriceBar = () => {
  const prices = [
    { name: "TRY", value: "3,158", symbol: "₺", change: "+2.1%" },
    { name: "USD", value: "1,476", symbol: "$", change: "-0.3%" },
    { name: "EUR", value: "1,587", symbol: "€", change: "+1.2%" },
    { name: "Altın", value: "42,312", symbol: "🥇", change: "+0.8%" },
    { name: "Gümüş", value: "2,157", symbol: "🥈", change: "-1.5%" }
  ];

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            Anlık Fiyatlar
          </h3>
          
          <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-8 price-slider py-3 px-4">
              {prices.concat(prices).concat(prices).map((price, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm whitespace-nowrap min-w-fit">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{price.symbol} {price.name}:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{price.value}</span>
                  <span className={`text-xs font-semibold px-2 py-1 ${
                    price.change.startsWith('+') 
                      ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
                      : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                  }`}>
                    {price.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceBar;

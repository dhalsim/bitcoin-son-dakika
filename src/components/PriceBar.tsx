
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
    <div className="bg-gray-100 dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <span className="mr-3">Anlık Fiyatlar</span>
            <span className="text-[#F7931A] satoshi-symbol text-xl"></span>
          </h3>
          
          <div className="relative overflow-hidden">
            <div className="flex items-center space-x-8 price-slider">
              {prices.concat(prices).map((price, index) => (
                <div key={index} className="flex items-center space-x-3 text-base whitespace-nowrap min-w-fit">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{price.symbol} {price.name}:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">{price.value}</span>
                  <span className="text-[#F7931A] satoshi-symbol"></span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${
                    price.change.startsWith('+') 
                      ? 'text-green-600 bg-green-100 dark:bg-green-900/20' 
                      : 'text-red-600 bg-red-100 dark:bg-red-900/20'
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

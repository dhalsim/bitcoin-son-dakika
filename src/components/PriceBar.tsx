
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
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <span className="mr-2">Anlık Fiyatlar (Satoshi Cinsinden)</span>
            <span className="text-[#F7931A] satoshi-symbol"></span>
          </h3>
          <div className="flex items-center space-x-6 overflow-x-auto">
            {prices.map((price, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm whitespace-nowrap">
                <span className="text-gray-600 dark:text-gray-400">{price.symbol} {price.name}:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{price.value}</span>
                <span className="text-[#F7931A] satoshi-symbol"></span>
                <span className={`text-xs ${price.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {price.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceBar;

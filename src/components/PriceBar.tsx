
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
    <div className="bg-gradient-to-r from-[#F7931A] to-orange-600 dark:from-[#F7931A] dark:to-orange-700 border-b border-orange-300 dark:border-orange-800 relative overflow-hidden">
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-3">Anlık Fiyatlar</span>
            <span className="text-white satoshi-symbol text-2xl"></span>
          </h3>
          
          <div className="relative overflow-hidden bg-black/20 dark:bg-black/40 rounded-lg backdrop-blur-sm">
            <div className="flex items-center space-x-12 price-slider py-4 px-6">
              {prices.concat(prices).concat(prices).map((price, index) => (
                <div key={index} className="flex items-center space-x-4 text-lg whitespace-nowrap min-w-fit">
                  <span className="text-white/90 font-medium">{price.symbol} {price.name}:</span>
                  <span className="font-bold text-white text-xl">{price.value}</span>
                  <span className="text-white satoshi-symbol"></span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    price.change.startsWith('+') 
                      ? 'text-green-100 bg-green-600/80' 
                      : 'text-red-100 bg-red-600/80'
                  }`}>
                    {price.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
    </div>
  );
};

export default PriceBar;


import React from 'react';

const PriceBar = () => {
  const prices = [
    { name: "TRY", value: "3,158", symbol: "₺", change: "+2.1%" },
    { name: "USD", value: "1,476", symbol: "$", change: "-0.3%" },
    { name: "EUR", value: "1,587", symbol: "€", change: "+1.2%" },
    { name: "GBP", value: "1,892", symbol: "£", change: "+0.5%" },
    { name: "CHF", value: "1,634", symbol: "₣", change: "-0.8%" },
    { name: "JPY", value: "0,098", symbol: "¥", change: "+1.1%" },
    { name: "Altın", value: "42,312", symbol: "🥇", change: "+0.8%" },
    { name: "Gümüş", value: "2,157", symbol: "🥈", change: "-1.5%" },
    { name: "BIST", value: "8,247", symbol: "📈", change: "+1.8%" },
    { name: "NASDAQ", value: "16,832", symbol: "📊", change: "+0.9%" },
    { name: "S&P 500", value: "4,967", symbol: "📈", change: "+0.4%" },
    { name: "DAX", value: "17,245", symbol: "📊", change: "-0.2%" }
  ];

  return (
    <div className="bg-main-accent text-white py-2 border-b border-orange-300 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center">
              <span className="mr-2">Anlık Fiyatlar</span>
              <span className="text-white satoshi-symbol text-lg"></span>
            </h3>
          </div>
          
          <div className="relative overflow-hidden bg-black/20 dark:bg-black/30 rounded backdrop-blur-sm">
            <div className="flex items-center space-x-3 sm:space-x-4 price-slider py-1.5 sm:py-2 px-3 sm:px-4">
              {prices.concat(prices).map((price, index) => (
                <div key={index} className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap min-w-fit">
                  <span className="text-white/90 font-medium">{price.symbol} {price.name}:</span>
                  <span className="font-bold text-white">{price.value}</span>
                  <span className="text-white satoshi-symbol"></span>
                  <span className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
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
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
    </div>
  );
};

export default PriceBar;

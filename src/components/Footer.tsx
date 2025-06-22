
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 dark:bg-black text-white mt-12 dark:border-t dark:border-gray-800 relative">
      {/* Background image */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(/lovable-uploads/f67c2cf5-3d5b-4310-9128-a823e7c74a4c.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/028135f1-856a-4e86-a719-a75eca32fa2a.png" 
                alt="Bitcoin News"
                className="h-8"
                style={{ width: '32px', height: '12px' }}
              />
            </div>
            <p className="text-gray-400 text-sm">
              Bitcoin dünyasındaki en güncel haberleri ve analizleri takip edin.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Kategoriler</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Haberler</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Köşe Yazıları</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Eğitim</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Podcast</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Hakkımızda</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Biz Kimiz</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">İletişim</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Gizlilik Politikası</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Kullanım Şartları</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Takip Edin</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">RSS</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Nostr</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">X (Twitter)</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#F7931A] transition-colors">Newsletter</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2025 Bitcoin Haber. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

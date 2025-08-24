import { useState, useEffect } from "react";

interface NIP05BadgeProps {
  nip05: string;
  pubkey: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function NIP05Badge({ nip05, pubkey, className = "", size = "md" }: NIP05BadgeProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [couldNotLoad, setCouldNotLoad] = useState(false);

  useEffect(() => {
    // Only run NIP-05 verification in browser environment
    if (typeof window === "undefined") {
      setIsLoading(false);
      setIsVerified(false);

      return;
    }

    const verifyNIP05 = async () => {
      try {
        const [username, host] = nip05.split("@");
        if (!username || !host) {
          setIsVerified(false);
          setIsLoading(false);

          return;
        }

        const response = await fetch(`https://${host}/.well-known/nostr.json?name=${username}`);

        if (!response.ok) {
          setCouldNotLoad(true);
          setIsLoading(false);

          return;
        }

        const data = await response.json();

        // If we get a response but it's empty or doesn't have names, it's likely an impersonator
        if (!data.names || Object.keys(data.names).length === 0) {
          setIsVerified(false);
          setIsLoading(false);

          return;
        }

        const verified = data.names && data.names[username] === pubkey;
        setIsVerified(verified);
      } catch (error) {
        console.error("NIP-05 verification failed:", error);
        setCouldNotLoad(true);
      } finally {
        setIsLoading(false);
      }
    };

    verifyNIP05();
  }, [nip05, pubkey]);

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "md":
        return "w-4 h-4";
      case "lg":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const verifiedIcon = (
    <svg className={getSizeClasses()} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  const notVerifiedIcon = (
    <svg className={getSizeClasses()} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );

  const sandClockIcon = (
    <svg className={getSizeClasses()} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );

  const couldNotLoadIcon = (
    <svg className={getSizeClasses()} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 00-1-1H9a1 1 0 100 2h1a1 1 0 001-1z"
        clipRule="evenodd"
      />
    </svg>
  );

  const currentIcon = isLoading
    ? sandClockIcon
    : couldNotLoad
      ? couldNotLoadIcon
      : isVerified
        ? verifiedIcon
        : notVerifiedIcon;

  const textColor = isLoading
    ? "text-gray-400"
    : couldNotLoad
      ? "text-yellow-600 dark:text-yellow-400"
      : isVerified
        ? "text-green-600 dark:text-green-400"
        : "text-gray-500";

  const getDescription = () => {
    if (isLoading) {
      return "Eşleşme bilgisi sunucudan alınıyor";
    }

    if (couldNotLoad) {
      return "Sunucudan cevap alınamadı. Geçici bir sorun olabilir.";
    }

    if (isVerified) {
      return "Bu Nostr Adresi ile kullanıcı açık anahtarı eşleşmektedir";
    }

    return "Bu Nostr Adresi ile kullanıcı açık anahtarı eşleşmemektedir";
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`} title={getDescription()}>
      <div className={`flex items-center space-x-1 ${textColor}`}>
        {currentIcon}
        <span className={`text-xs ${isVerified ? "font-medium" : ""}`}>{nip05}</span>
      </div>
    </div>
  );
}

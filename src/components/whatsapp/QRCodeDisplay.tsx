
import React from 'react';

interface QRCodeDisplayProps {
  qrCode: string;
}

export function QRCodeDisplay({ qrCode }: QRCodeDisplayProps) {
  return (
    <div className="flex justify-center">
      <img 
        src={`data:image/png;base64,${qrCode}`} 
        alt="QR Code para conectar WhatsApp"
        className="max-w-64 max-h-64 border rounded-lg"
      />
    </div>
  );
}

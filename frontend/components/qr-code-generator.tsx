"use client"

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  qrCodeData: string;
  userName: string;
}

export function QRCodeGenerator({ qrCodeData, userName }: QRCodeGeneratorProps) {
  const [size, setSize] = useState(256);
  
  // Generate a filename for download
  const sanitizedName = userName.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
  const fileName = `${sanitizedName}_qrcode.png`;
  
  // Function to download QR code as image
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Convert the SVG to canvas
    const qrCodeSvg = document.getElementById('qr-code-svg');
    if (!qrCodeSvg) return;
    
    const svgData = new XMLSerializer().serializeToString(qrCodeSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    // Create an image from the SVG
    const img = new Image();
    img.onload = () => {
      // Create canvas and draw the image on it
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0, size, size);
      
      // Create download link
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-4 flex flex-col items-center space-y-3">
        <div id="qr-code" className="bg-white p-3 rounded-lg">
          <QRCodeSVG 
            id="qr-code-svg"
            value={qrCodeData} 
            size={size}
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="text-sm text-center text-muted-foreground">
          This is your unique QR code for login authentication.<br />
          Please download and keep it safe.
        </p>
      </Card>
      
      <Button 
        onClick={downloadQRCode}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download QR Code
      </Button>
    </div>
  );
} 
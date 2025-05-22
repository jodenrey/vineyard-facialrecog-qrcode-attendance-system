"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QrCode, RefreshCw, Keyboard } from 'lucide-react';

type QRCodeScannerProps = {
  onScanSuccess: (userId: string) => void;
}

export function QRCodeScanner({ onScanSuccess }: QRCodeScannerProps) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Focus the barcode input whenever scanning is enabled
    if (isScanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isScanning]);

  const clearError = () => setError(null);

  // Parse QR code - if it's a numeric ID try to use that, otherwise verify full string
  const parseQrCode = (qrCode: string): string => {
    // Clean up any whitespace or control characters first
    const cleanedCode = qrCode.trim();
    
    // If the QR is just a numeric ID, use that directly
    if (/^\d+$/.test(cleanedCode)) {
      console.log("QR detected as numeric ID:", cleanedCode);
      return cleanedCode;
    }
    
    // Check if it's our standard format with hyphens: vineyardacademy-uuid-userId
    const hyphenMatch = cleanedCode.match(/vineyardacademy-[a-f0-9-]+-([a-f0-9-]+)$/i);
    if (hyphenMatch && hyphenMatch[1]) {
      console.log("QR detected as hyphenated format, userId:", hyphenMatch[1]);
      return hyphenMatch[1]; // Return just the userId portion
    }
    
    // Check if it's a format with slashes: vineyardacademy/uuid/userId
    const slashMatch = cleanedCode.match(/vineyardacademy\/([a-f0-9\/]+)$/i);
    if (slashMatch && slashMatch[1]) {
      // Extract the last part which should be the user ID
      const parts = slashMatch[1].split('/');
      if (parts.length > 0) {
        const userId = parts[parts.length - 1];
        console.log("QR detected as slash format, userId:", userId);
        return userId; // Return the last part as userId
      }
    }
    
    // Handle any other common format issues
    // Replace all slashes with hyphens and try again
    const normalizedCode = cleanedCode.replace(/\//g, '-');
    if (normalizedCode !== cleanedCode) {
      console.log("Normalizing code by replacing slashes with hyphens");
      return parseQrCode(normalizedCode); // Recursively try with normalized format
    }
    
    // If nothing else matched, this is probably the raw code - just pass it through
    console.log("No format detected, passing through as-is:", cleanedCode);
    return cleanedCode;
  };

  const verifyQrCode = async (qrCode: string) => {
    if (isProcessing) return false; // Prevent multiple submissions
    setIsProcessing(true);
    
    if (!qrCode || qrCode.trim() === '') {
      setError('Empty QR code detected');
      setIsProcessing(false);
      return false;
    }
    
    try {
      // Log raw scan data for debugging
      console.log("Raw QR code scanned:", qrCode);
      
      // Parse the QR code to handle different formats
      const parsedCode = parseQrCode(qrCode);
      console.log("Parsed QR code:", parsedCode);
      
      // First try direct user ID lookup if it appears to be an ID
      if (/^cl[a-z0-9]+$/.test(parsedCode) || /^\d+$/.test(parsedCode)) {
        try {
          console.log("Attempting direct ID lookup for:", parsedCode);
          
          const userResponse = await fetch(`/api/users/${parsedCode}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user && userData.user.id) {
              console.log("Direct user lookup successful:", userData.user);
              
              toast({
                title: "Success",
                description: "User verified successfully by ID",
              });
              onScanSuccess(userData.user.id);
              setIsProcessing(false);
              return true;
            }
          } else {
            const errorData = await userResponse.clone().json().catch(() => ({}));
            console.log("User ID lookup failed with status:", userResponse.status, errorData);
          }
        } catch (err) {
          console.log("User ID direct lookup error:", err);
          // Continue to try the regular QR verification
        }
      }
      
      // Try with full QR code verification endpoint
      try {
        console.log("Attempting QR verification with code:", qrCode);
        
        // First try with original QR code
        const response = await fetch('/api/auth/verify-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrCode: qrCode }),
        });
        
        // If that fails, try with the parsed code
        if (!response.ok && parsedCode !== qrCode) {
          console.log("Original QR verification failed, trying with parsed code...");
          
          const parsedResponse = await fetch('/api/auth/verify-qr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ qrCode: parsedCode }),
          });
          
          if (parsedResponse.ok) {
            const result = await parsedResponse.json();
            if (result.valid && result.userId) {
              toast({
                title: "Success",
                description: "QR code verified successfully (parsed)",
              });
              onScanSuccess(result.userId);
              setIsProcessing(false);
              return true;
            }
          } else {
            console.log("Parsed code verification failed with status:", parsedResponse.status);
          }
          
          // Both attempts failed, throw error for the original response
          const error = await response.json();
          throw new Error(error.message || 'Invalid QR code');
        }
        
        // Process original response if it was successful
        if (response.ok) {
          const result = await response.json();
          if (result.valid && result.userId) {
            toast({
              title: "Success",
              description: "QR code verified successfully",
            });
            onScanSuccess(result.userId);
            setIsProcessing(false);
            return true;
          }
        } else {
          const error = await response.json();
          throw new Error(error.message || 'Invalid QR code');
        }
        
        // If we got here, the QR was not valid
        toast({
          variant: "destructive",
          title: "Invalid QR Code",
          description: "The QR code could not be verified",
        });
        setIsProcessing(false);
        return false;
      } catch (error) {
        console.error('QR validation error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred verifying the QR code');
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to verify QR code',
        });
        setIsProcessing(false);
        return false;
      }
    } catch (error) {
      console.error('QR processing error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred processing the QR code');
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process QR code',
      });
      setIsProcessing(false);
      return false;
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcodeInput.trim()) {
      setError('Please scan or enter a QR code');
      return;
    }

    await verifyQrCode(barcodeInput);
    setBarcodeInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Most barcode scanners will send an Enter key after scanning
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault(); // Prevent form submission
      verifyQrCode(barcodeInput).then(() => {
        setBarcodeInput('');
      });
    }
  };

  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scannedValue = e.target.value;
    setBarcodeInput(scannedValue);
  };

  const startScanner = () => {
    setIsScanning(true);
    setError(null);
    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-lg border-2 border-primary/20 relative p-4">
        <form onSubmit={handleBarcodeSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={handleBarcodeInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Scan or type QR code here"
              className="w-full p-2 border border-gray-300 rounded-md"
              autoComplete="off"
              autoFocus={isScanning}
              disabled={!isScanning}
            />
          </div>
          
          {isScanning ? (
            <p className="text-center text-green-600">
              <RefreshCw className="inline h-4 w-4 animate-spin mr-2" />
              Ready to receive barcode scan...
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <Keyboard className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-center text-muted-foreground">
                Click Start to activate USB scanner
              </p>
            </div>
          )}
        </form>
      </Card>
      
      {/* Error message display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm relative">
          <button 
            className="absolute right-2 top-2 text-red-500 hover:text-red-700"
            onClick={clearError}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="font-medium">Error</div>
          <div>{error}</div>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button 
          onClick={isScanning ? stopScanner : startScanner} 
          className="flex-1"
        >
          {isScanning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Stop Scanner
            </>
          ) : (
            <>
              <QrCode className="mr-2 h-4 w-4" />
              Start Scanner
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 
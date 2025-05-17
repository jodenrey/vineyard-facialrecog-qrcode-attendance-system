"use client"

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Camera, UserCheck, RefreshCw } from 'lucide-react';

type FacialRecognitionProps = {
  onRecognized: (userId: string) => void;
  mode?: 'recognition' | 'registration';
  userId?: string;
}

export function FacialRecognition({ 
  onRecognized, 
  mode = 'recognition',
  userId 
}: FacialRecognitionProps) {
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const captureImage = useCallback(async () => {
    setIsCapturing(true);
    setError(null); // Clear any previous errors
    
    try {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        
        if (imageSrc) {
          let apiEndpoint = '';
          let requestBody = {};
          
          if (mode === 'recognition') {
            apiEndpoint = '/api/face/recognize';
            requestBody = { image: imageSrc };
          } else if (mode === 'registration' && userId) {
            apiEndpoint = '/api/face/register';
            requestBody = { 
              user_id: userId,
              image: imageSrc 
            };
          } else {
            throw new Error('Invalid mode or missing userId for registration');
          }
          
          console.log(`Sending request to ${apiEndpoint}`);
          
          // Send to facial recognition API
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}):`, errorText);
            
            // Try to parse the error as JSON to extract the detail message
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.detail && errorJson.detail.includes("already registered")) {
                // This is a duplicate face error - show a more user-friendly message
                const friendlyError = "This face appears to be already registered to another user account. Each face can only be registered once for security reasons.";
                setError(friendlyError);
                toast({
                  variant: "destructive",
                  title: "Face Already Registered",
                  description: friendlyError,
                });
                setIsCapturing(false);
                return; // Exit early
              }
            } catch (parseError) {
              // Ignore parsing error, will fall back to generic message
            }
            
            throw new Error(`API returned ${response.status}: ${errorText}`);
          }
          
          const result = await response.json();
          console.log('API Response:', result);
          
          if (result.success) {
            if (mode === 'recognition') {
              toast({
                title: "Success",
                description: "Face recognized successfully",
              });
              onRecognized(result.user_id);
            } else {
              toast({
                title: "Success",
                description: "Face registered successfully",
              });
              onRecognized(userId!);
            }
          } else {
            toast({
              variant: "destructive",
              title: "Failed",
              description: result.message || "Face recognition failed",
            });
          }
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not capture image. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Face recognition error:", error);
      
      // Set the error message for display in the UI
      setError(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred. Please try again."
      );
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [onRecognized, toast, mode, userId, role]);

  return (
    <div className="space-y-4">
      {mode === 'recognition' && (
        <Tabs defaultValue="student" className="w-full mb-4" onValueChange={setRole}>
        </Tabs>
      )}
      
      <Card className="overflow-hidden rounded-lg border-2 border-primary/20 relative">
        <div className={`absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-sm transition-opacity duration-300 ${isCapturing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="animate-pulse text-primary font-medium">
            {mode === 'recognition' ? 'Recognizing...' : 'Registering...'}
          </div>
        </div>
        
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 360,
            height: 270,
            facingMode: "user"
          }}
          className="w-full h-[270px] object-cover"
        />
        
        {/* Face outline overlay */}
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-44 border-2 border-dashed border-primary/60 rounded-full"></div>
        </div>
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
      
      <div className="flex gap-4">
        <Button onClick={captureImage} disabled={isCapturing} className="flex-1">
          {isCapturing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              {mode === 'recognition' ? 'Recognize Face' : 'Register Face'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
"use client"

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Camera, UserCheck, RefreshCw } from 'lucide-react';

export function FacialRecognition({ onRecognized }: { onRecognized: (role: string) => void }) {
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [role, setRole] = useState('student');

  const captureImage = useCallback(() => {
    setIsCapturing(true);
    
    setTimeout(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        
        if (imageSrc) {
          // In a real app, you would send this image to the backend for facial recognition
          // For demo purposes, we'll simulate a successful recognition after a delay
          
          setTimeout(() => {
            onRecognized(role);
            setIsCapturing(false);
          }, 1500);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not capture image. Please try again.",
          });
          setIsCapturing(false);
        }
      }
    }, 500);
  }, [onRecognized, toast, role]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="student" className="w-full mb-4" onValueChange={setRole}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card className="overflow-hidden rounded-lg border-2 border-primary/20 relative">
        <div className={`absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-sm transition-opacity duration-300 ${isCapturing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="animate-pulse text-primary font-medium">
            Recognizing...
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
              Recognize Face
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FacialRecognition } from '@/components/facial-recognition';
import { QRCodeScanner } from '@/components/qr-code-scanner';
import { School, User, KeyRound, QrCode, Shield, Check, ChevronRight } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recognizedUserId, setRecognizedUserId] = useState<string | null>(null);
  const [qrScannedUserId, setQrScannedUserId] = useState<string | null>(null);
  const [biometricStep, setBiometricStep] = useState<'face' | 'qr'>('face');

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Show attendance status if available
        let toastMessage = `${data.user.role.toLowerCase()} login successful`;
        if (data.attendance && data.attendance.success) {
          toastMessage += ` - ${data.attendance.message}`;
        } else if (data.attendance && !data.attendance.success) {
          toastMessage += ` - ${data.attendance.message}`;
        }

        toast({
          title: "Success",
          description: toastMessage,
        });
        
        // Redirect based on role
        if (data.user.role === 'ADMIN') {
          router.push('/dashboard/admin');
        } else if (data.user.role === 'TEACHER') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/dashboard/student');
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Invalid email or password",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceRecognized = (userId: string) => {
    setRecognizedUserId(userId);
    setBiometricStep('qr');
    toast({
      title: "Face Recognized",
      description: "Now please scan your QR code to complete login",
    });
  };

  const handleQRScanned = async (userId: string) => {
    setQrScannedUserId(userId);
    
    // Verify that QR code and face belong to the same user
    if (recognizedUserId) {
      try {
        const response = await fetch('/api/auth/verify-biometric', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            faceUserId: recognizedUserId,
            qrUserId: userId 
          }),
        });
        
        const result = await response.json();
        
        if (response.ok && result.valid) {
          completeBiometricLogin(result.userId, result.attendance);
        } else {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: result.message || "Face and QR code don't match the same user",
          });
          // Reset the biometric flow
          resetBiometricAuth();
        }
      } catch (error) {
        console.error("Biometric verification error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify biometric authentication",
        });
        resetBiometricAuth();
      }
    } else {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Face recognition required before QR code scan",
      });
      resetBiometricAuth();
    }
  };

  const resetBiometricAuth = () => {
    setRecognizedUserId(null);
    setQrScannedUserId(null);
    setBiometricStep('face');
  };

  const completeBiometricLogin = async (userId: string, attendanceResult?: any) => {
    try {
      // Get user data from API
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      // Check if userData.user exists
      const userData = await response.json();
      if (!userData.user || !userData.user.role) {
        throw new Error('Invalid user data received from server');
      }
      
      // Show attendance status if available
      let toastMessage = `${userData.user.role.toLowerCase()} login successful via biometric authentication`;
      if (attendanceResult && attendanceResult.success) {
        toastMessage += ` - ${attendanceResult.message}`;
      } else if (attendanceResult && !attendanceResult.success) {
        toastMessage += ` - ${attendanceResult.message}`;
      }
      
      toast({
        title: "Success",
        description: toastMessage,
      });
      
      // Redirect based on role
      if (userData.user.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else if (userData.user.role === 'TEACHER') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/dashboard/student');
      }
    } catch (error) {
      console.error("Error during biometric login:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete login after biometric authentication.",
      });
      resetBiometricAuth();
    }
  };

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="manual" className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Manual Login
        </TabsTrigger>
        <TabsTrigger value="biometric" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Biometric Login
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual" className="space-y-4">
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
        
        <div className="pt-4 text-sm text-muted-foreground">
          <p className="text-center">Demo Account:</p>
          <div className="mt-2">
            <Card className="p-2 text-center text-xs">
              admin@vineyard.edu / password123
            </Card>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="biometric" className="space-y-6">
        <div className="bg-muted/50 p-3 rounded-md mb-4 text-sm text-center">
          <p className="font-medium mb-1">Two-Factor Biometric Authentication</p>
          <p className="text-muted-foreground">Complete both face recognition and QR code scan to login securely</p>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className={`flex flex-col items-center ${biometricStep === 'face' ? 'text-primary' : 'text-primary/70'}`}>
            <div className={`w-10 h-10 rounded-full ${biometricStep === 'face' ? 'bg-primary' : recognizedUserId ? 'bg-green-500' : 'bg-muted'} flex items-center justify-center text-white mb-2`}>
              {recognizedUserId ? <Check className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <span className="text-xs font-medium">Face Scan</span>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground" />

          <div className={`flex flex-col items-center ${biometricStep === 'qr' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full ${biometricStep === 'qr' ? 'bg-primary' : qrScannedUserId ? 'bg-green-500' : 'bg-muted'} flex items-center justify-center text-white mb-2`}>
              {qrScannedUserId ? <Check className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
            </div>
            <span className="text-xs font-medium">QR Code</span>
          </div>
        </div>

        {biometricStep === 'face' ? (
          <>
            <FacialRecognition
              mode="recognition"
              onRecognized={handleFaceRecognized}
            />
            <p className="text-sm text-muted-foreground text-center">
              First, position your face within the frame for recognition
            </p>
          </>
        ) : (
          <>
            <QRCodeScanner
              onScanSuccess={handleQRScanned}
            />
            <p className="text-sm text-muted-foreground text-center">
              Now, scan your QR code to complete login
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={resetBiometricAuth}
            >
              Start Over
            </Button>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
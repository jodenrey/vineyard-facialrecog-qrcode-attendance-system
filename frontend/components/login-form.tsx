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
import { School, User, KeyRound } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        toast({
          title: "Success",
          description: `${data.user.role.toLowerCase()} login successful`,
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

  const handleFaceLogin = (role: string) => {
    // In a real app, this would verify the face against the database
    // For demo purposes, we redirect based on role
    toast({
      title: "Success",
      description: `${role} login successful via facial recognition`,
    });
    
    if (role === 'teacher') {
      router.push('/dashboard/teacher');
    } else {
      router.push('/dashboard/student');
    }
  };

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="manual" className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Manual Login
        </TabsTrigger>
        <TabsTrigger value="facial" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Facial Login
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
      
      <TabsContent value="facial" className="space-y-4">
        <FacialRecognition onRecognized={handleFaceLogin} />
        
        <p className="text-sm text-muted-foreground text-center">
          Position your face within the frame for recognition
        </p>
      </TabsContent>
    </Tabs>
  );
}
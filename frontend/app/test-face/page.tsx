"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FacialRecognition } from '@/components/facial-recognition';

export default function TestFacialRecognition() {
  const [result, setResult] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [mode, setMode] = useState<'recognition' | 'registration'>('recognition');

  const handleRecognized = (id: string) => {
    setResult(`Success! User ID: ${id}`);
  };

  return (
    <div className="container mx-auto p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Facial Recognition Test</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mode">Mode</Label>
          <div className="flex space-x-4">
            <Button 
              variant={mode === 'recognition' ? 'default' : 'outline'}
              onClick={() => setMode('recognition')}
            >
              Recognition
            </Button>
            <Button 
              variant={mode === 'registration' ? 'default' : 'outline'}
              onClick={() => setMode('registration')}
            >
              Registration
            </Button>
          </div>
        </div>
        
        {mode === 'registration' && (
          <div className="space-y-2">
            <Label htmlFor="userId">User ID (for registration)</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID for face registration"
            />
          </div>
        )}
        
        <div className="border p-4 rounded-lg">
          <FacialRecognition
            mode={mode}
            userId={userId}
            onRecognized={handleRecognized}
          />
        </div>
        
        {result && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            {result}
          </div>
        )}
        
        <p className="text-sm text-gray-500">
          This is a test page for the facial recognition system. Use it to verify that your backend is properly connected.
        </p>
      </div>
    </div>
  );
} 
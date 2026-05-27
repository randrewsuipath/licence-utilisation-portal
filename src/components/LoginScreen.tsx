import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, AlertCircle } from 'lucide-react';
export function LoginScreen() {
  const { login, isInitializing, error } = useAuth();
  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Licence Utilisation Portal
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Please log in with your UiPath account to access the portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-1">Authentication Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          <Button
            onClick={handleLogin}
            className="w-full"
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Log In with UiPath
          </Button>
          <p className="text-xs text-center text-gray-500 mt-4">
            You will be redirected to UiPath's secure login page
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
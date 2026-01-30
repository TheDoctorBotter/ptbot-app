import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Stethoscope } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Stethoscope className="h-10 w-10 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dr. Justin Lemmo</h1>
              <p className="text-sm text-gray-600">Virtual Physical Therapy</p>
            </div>
          </div>
        </div>

        {isLogin ? (
          <LoginForm
            onSuccess={onSuccess}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm
            onSuccess={onSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
};
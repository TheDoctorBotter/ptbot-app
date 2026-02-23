import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <img src="/Logo.png" alt="PTBot" className="h-20 w-auto object-contain mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">Dr. Justin Lemmo</h1>
            <p className="text-sm text-gray-600">Virtual Physical Therapy</p>
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
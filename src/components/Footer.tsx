import React from 'react';
import { Stethoscope, Mail, Youtube, Shield, FileText } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Stethoscope className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="text-xl font-bold">Dr. Justin Lemmo</h3>
                <p className="text-gray-400">Doctor of Physical Therapy</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Providing expert virtual physical therapy services with 15+ years of experience 
              in orthopedics and pediatric care.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-blue-400 mr-3" />
                <a
                  href="mailto:justinlemmodpt@gmail.com"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  justinlemmodpt@gmail.com
                </a>
              </div>
              <div className="flex items-center">
                <Youtube className="h-5 w-5 text-red-400 mr-3" />
                <a
                  href="https://www.youtube.com/@justinlemmodpt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Exercise Video Library
                </a>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal & Licensing</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-400 mr-3" />
                <span className="text-gray-300 text-sm">
                  Texas PT License #1215276
                </span>
              </div>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-400 mr-3" />
                <span className="text-gray-300 text-sm">
                  HIPAA Compliant Services
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Licensed physical therapist providing telehealth services in accordance with state regulations.
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Dr. Justin Lemmo, DPT. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#disclaimers" className="text-gray-400 hover:text-white text-sm transition-colors">
                Medical Disclaimers
              </a>
              <a href="#disclaimers" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#licensing" className="text-gray-400 hover:text-white text-sm transition-colors">
                Licensing Information
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
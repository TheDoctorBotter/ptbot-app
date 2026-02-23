import React from 'react';
import { Award, Users, Clock } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-neutral-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <img
              src="/Logo.png"
              alt="PTBot"
              className="h-[10.5rem] w-auto object-contain"
            />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Virtual Physical Therapy
            <span className="block text-primary-500">Tailored for You</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Licensed Doctor of Physical Therapy (TX #1215276) with 15 years of experience in orthopedics and pediatrics. 
            I specialize in recovery from low back pain, hip pain, shoulder pain, and knee pain, 
            along with addressing any musculoskeletal concerns.
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            I also guide parents through developmental therapy plans for children with milestone delays, 
            low muscle tone, joint spasticity, and gross motor delays.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="flex flex-col items-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4">
                <Award className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">15+ Years Experience</h3>
              <p className="text-gray-600 text-center">Licensed PT specializing in orthopedics and pediatric physical therapy</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">PTBot Affiliate</h3>
              <p className="text-gray-600 text-center">Working directly with PTBot to ensure AI accuracy and proper follow-through</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 p-4 rounded-full mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Virtual Convenience</h3>
              <p className="text-gray-600 text-center">HIPAA-compliant telehealth services from the comfort of your home</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
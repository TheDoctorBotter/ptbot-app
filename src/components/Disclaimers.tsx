import React, { useState } from 'react';
import { Shield, FileText, MapPin, Eye, EyeOff } from 'lucide-react';

interface DisclaimersProps {
  id?: string;
}

export const Disclaimers: React.FC<DisclaimersProps> = ({ id }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <section id={id} className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Important Legal Information
          </h2>
          <p className="text-lg text-gray-600">
            Please review these important disclaimers and licensing information
          </p>
        </div>

        <div className="space-y-6">
          {/* Medical Disclaimer */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('medical')}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <Shield className="h-6 w-6 text-red-600" />
                <h3 className="text-xl font-semibold text-gray-900">Medical Disclaimer</h3>
              </div>
              {expandedSection === 'medical' ? 
                <EyeOff className="h-5 w-5 text-gray-500" /> : 
                <Eye className="h-5 w-5 text-gray-500" />
              }
            </button>
            {expandedSection === 'medical' && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Disclaimer:</strong> The content provided on this website is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. By using this site and engaging in virtual consultations, you acknowledge that you are receiving physical therapy services from a licensed provider based in Texas. If you experience a medical emergency, call 911 immediately.
                </p>
              </div>
            )}
          </div>

          {/* Telehealth Consent */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('telehealth')}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <FileText className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Telehealth Services Consent</h3>
              </div>
              {expandedSection === 'telehealth' ? 
                <EyeOff className="h-5 w-5 text-gray-500" /> : 
                <Eye className="h-5 w-5 text-gray-500" />
              }
            </button>
            {expandedSection === 'telehealth' && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Telehealth Services Consent:</strong> By scheduling a virtual physical therapy session, you consent to receive services via telehealth. You understand that telehealth involves the use of electronic communications to provide physical therapy services remotely and that limitations may exist compared to in-person care. You agree that you reside in a state where Dr. Justin Lemmo, PT, DPT is licensed to provide services.
                </p>
              </div>
            )}
          </div>

          {/* Licensing Notice */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('licensing')}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <MapPin className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">Licensing Notice</h3>
              </div>
              {expandedSection === 'licensing' ? 
                <EyeOff className="h-5 w-5 text-gray-500" /> : 
                <Eye className="h-5 w-5 text-gray-500" />
              }
            </button>
            {expandedSection === 'licensing' && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Licensing Notice:</strong> Virtual physical therapy services are only available to clients located in Texas and other states where Dr. Justin Lemmo holds an active license or PT Compact privilege. Clients are responsible for confirming their state of residence before receiving services.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    Texas Physical Therapy License #1215276
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Dr. Justin Lemmo, PT, DPT - Licensed in the State of Texas
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* HIPAA Privacy Policy */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('hipaa')}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <Shield className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">HIPAA Privacy Policy</h3>
              </div>
              {expandedSection === 'hipaa' ? 
                <EyeOff className="h-5 w-5 text-gray-500" /> : 
                <Eye className="h-5 w-5 text-gray-500" />
              }
            </button>
            {expandedSection === 'hipaa' && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="text-gray-700 leading-relaxed space-y-4">
                  <p>
                    <strong>Notice of Privacy Practices:</strong> Dr. Justin Lemmo, PT, DPT is committed to protecting your health information in accordance with the Health Insurance Portability and Accountability Act (HIPAA).
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">How We Use Your Information:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                        <li>Treatment: To provide physical therapy services and coordinate care</li>
                        <li>Payment: To process payments and insurance claims</li>
                        <li>Healthcare Operations: To improve quality of care and business operations</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Your Rights:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                        <li>Request restrictions on use and disclosure of your information</li>
                        <li>Request access to and copies of your health records</li>
                        <li>Request amendments to your health information</li>
                        <li>File a complaint if you believe your privacy rights have been violated</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Security Measures:</h4>
                      <p className="text-sm mt-2">
                        All telehealth sessions are conducted through secure, HIPAA-compliant platforms. 
                        Your personal health information is encrypted and stored securely in accordance with federal regulations.
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-purple-800 text-sm">
                        <strong>Contact for Privacy Concerns:</strong> justinlemmodpt@gmail.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
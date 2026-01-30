import React, { useState } from 'react';
import { Star, Quote, X, Loader2 } from 'lucide-react';

interface Testimonial {
  name: string;
  condition: string;
  rating: number;
  text: string;
  timeframe: string;
}

interface TestimonialsProps {
  id?: string;
  user?: any;
  onShowAuth?: () => void;
}
const testimonials: Testimonial[] = [
  {
    name: "Sarah M.",
    condition: "Lower Back Pain",
    rating: 5,
    text: "Dr. Lemmo's virtual consultation was incredibly thorough. He helped me understand exactly how to use PTBot's recommendations and gave me the confidence to progress my recovery safely. My back pain has improved significantly!",
    timeframe: "3 months ago"
  },
  {
    name: "Michael R.",
    condition: "Shoulder Injury",
    rating: 5,
    text: "The custom recovery plan was exactly what I needed. The exercise videos were perfectly tailored to my injury, and the follow-up support kept me on track. Worth every penny.",
    timeframe: "2 months ago"  
  },
  {
    name: "Jennifer L.",
    condition: "Pediatric Development",
    rating: 5,
    text: "As a parent, I was worried about my son's gross motor delays. Dr. Lemmo provided clear guidance and exercises that we could do at home. We've seen remarkable progress in just a few weeks.",
    timeframe: "1 month ago"
  },
  {
    name: "David K.",
    condition: "Knee Pain",
    rating: 5,
    text: "The 3-month guided program transformed my recovery. Having Dr. Lemmo available for questions and adjustments made all the difference. I'm now pain-free and stronger than before my injury.",
    timeframe: "4 months ago"
  },
  {
    name: "Lisa T.",
    condition: "Hip Pain",
    rating: 5,
    text: "Working with Dr. Lemmo remotely was seamless. His expertise in combining PTBot's AI recommendations with personalized care gave me the best of both worlds. Highly recommend!",
    timeframe: "2 months ago"
  },
  {
    name: "Mark S.",
    condition: "Multiple Concerns",
    rating: 5,
    text: "Dr. Lemmo addressed both my shoulder and back issues comprehensively. His virtual approach saved me time and money while delivering professional-grade physical therapy care.",
    timeframe: "6 weeks ago"
  }
];

export const Testimonials: React.FC<TestimonialsProps> = ({ id, user, onShowAuth }) => {
  const [showSuccessStoryForm, setShowSuccessStoryForm] = useState(false);
  const [successStoryData, setSuccessStoryData] = useState({
    name: '',
    condition: '',
    story: '',
    timeframe: ''
  });
  const [submittingStory, setSubmittingStory] = useState(false);

  const handleSuccessStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingStory(true);

    try {
      // Here you would typically save to your database
      // For now, we'll just show a success message
      alert('Thank you for sharing your success story! It will be reviewed and may appear on our testimonials page.');
      setShowSuccessStoryForm(false);
      setSuccessStoryData({ name: '', condition: '', story: '', timeframe: '' });
    } catch (error) {
      console.error('Error submitting success story:', error);
      alert('There was an error submitting your story. Please try again.');
    } finally {
      setSubmittingStory(false);
    }
  };

  return (
    <>
    <section id={id} className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how virtual physical therapy has helped patients achieve their recovery goals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-primary-500 mr-3" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.condition}</p>
                  </div>
                  <p className="text-sm text-gray-500">{testimonial.timeframe}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-6">
            Ready to start your recovery journey?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#services"
              className="inline-flex items-center bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Choose Your Package
            </a>
            {user ? (
              <button
                onClick={() => setShowSuccessStoryForm(true)}
                className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Share Your Success Story
              </button>
            ) : (
              <button
                onClick={onShowAuth}
                className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Share Your Success Story
              </button>
            )}
          </div>
        </div>
      </div>
    </section>

    {/* Success Story Modal */}
    {showSuccessStoryForm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Share Your Success Story</h3>
              <button
                onClick={() => setShowSuccessStoryForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSuccessStorySubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (or initials)
                </label>
                <input
                  type="text"
                  required
                  value={successStoryData.name}
                  onChange={(e) => setSuccessStoryData({ ...successStoryData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Sarah M."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition/Issue Treated
                </label>
                <input
                  type="text"
                  required
                  value={successStoryData.condition}
                  onChange={(e) => setSuccessStoryData({ ...successStoryData, condition: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Lower Back Pain, Shoulder Injury"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Success Story
                </label>
                <textarea
                  required
                  rows={4}
                  value={successStoryData.story}
                  onChange={(e) => setSuccessStoryData({ ...successStoryData, story: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell us about your experience with Dr. Lemmo's virtual PT services and how it helped your recovery..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When did you receive treatment?
                </label>
                <select
                  required
                  value={successStoryData.timeframe}
                  onChange={(e) => setSuccessStoryData({ ...successStoryData, timeframe: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select timeframe</option>
                  <option value="1 week ago">1 week ago</option>
                  <option value="2 weeks ago">2 weeks ago</option>
                  <option value="1 month ago">1 month ago</option>
                  <option value="2 months ago">2 months ago</option>
                  <option value="3 months ago">3 months ago</option>
                  <option value="6 months ago">6 months ago</option>
                  <option value="1 year ago">1 year ago</option>
                </select>
              </div>
              
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-primary-800 text-sm">
                  <strong>Note:</strong> Your story will be reviewed before appearing on the website. 
                  We may edit for length and clarity while preserving your message.
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowSuccessStoryForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStory}
                  className="flex-1 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {submittingStory ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Story</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
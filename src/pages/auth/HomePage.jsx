import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';
import ContactModal from '../../components/modals/ContactModal';
import SuccessModal from '../../components/modals/SuccessModal';
import LoginModal from '../../components/modals/LoginModal';
import { 
  ClipboardListIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CheckCircleIcon 
} from '@heroicons/react/outline';

/**
 * Homepage component for unauthenticated users
 * Landing page with features and call-to-action
 */
const HomePage = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleGetStarted = () => {
    setShowContactModal(true);
  };

  const handleContactSubmit = (formData) => {
    console.log('Contact form submitted:', formData);
    setShowContactModal(false);
    setShowSuccessModal(true);
  };

  const features = [
    {
      icon: ClipboardListIcon,
      title: 'Task Management',
      description: 'Create, organize, and track tasks efficiently'
    },
    {
      icon: UserGroupIcon,
      title: 'Team Collaboration',
      description: 'Work together with your team seamlessly'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics',
      description: 'Track productivity with detailed insights'
    },
    {
      icon: CheckCircleIcon,
      title: 'Goal Tracking',
      description: 'Set and achieve your productivity goals'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Logo size="lg" variant="dark" />
              <h1 className="text-2xl font-bold text-white">TaskHive</h1>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-6">
                <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
                <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
              </nav>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="text-black font-semibold px-6 py-2 rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: '#ffc44d' }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
              Powerful task insights for <span style={{ color: '#ffc44d' }}>all</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              TaskHive makes task management easy for everyone. Visualise key metrics, track performance, and discover trends without needing a project management background.
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={handleGetStarted}
                className="text-black font-semibold px-8 py-3 rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: '#ffc44d' }}
              >
                Get started
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-3 rounded-lg transition-colors">
                Learn more
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-white mb-12">
            Everything you need to stay productive
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto h-12 w-12 mb-4" style={{ color: '#ffc44d' }}>
                  <feature.icon className="h-12 w-12" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stories */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-white mb-12">
            Success Stories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-4xl font-bold mb-2" style={{ color: '#ffc44d' }}>40%</div>
              <div className="text-lg font-semibold text-white mb-2">Faster Project Delivery</div>
              <p className="text-gray-300">"TaskHive helped our team reduce project completion time by 40% through better task organization."</p>
              <div className="mt-4 text-sm text-gray-400">- Tech Solutions Pvt Ltd</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-4xl font-bold mb-2" style={{ color: '#ffc44d' }}>95%</div>
              <div className="text-lg font-semibold text-white mb-2">Team Satisfaction</div>
              <p className="text-gray-300">"Our team productivity increased significantly with clear task visibility and collaboration features."</p>
              <div className="mt-4 text-sm text-gray-400">- Creative Agency Mumbai</div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-4xl font-bold mb-2" style={{ color: '#ffc44d' }}>60%</div>
              <div className="text-lg font-semibold text-white mb-2">Reduced Meetings</div>
              <p className="text-gray-300">"TaskHive's transparency eliminated unnecessary status meetings and improved focus time."</p>
              <div className="mt-4 text-sm text-gray-400">- Startup Bangalore</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-white mb-4">
            Simple, Transparent Pricing
          </h3>
          <p className="text-center text-gray-300 mb-12">Choose the plan that fits your team size and needs</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
              <h4 className="text-xl font-semibold text-white mb-2">Starter</h4>
              <div className="text-3xl font-bold text-white mb-4">₹299<span className="text-lg font-normal text-gray-400">/month</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Up to 5 users</li>
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Basic task management</li>
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Email support</li>
              </ul>
              <button className="w-full border border-gray-600 text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">Start Free Trial</button>
            </div>
            <div className="border-2 rounded-lg p-6 bg-gray-900 relative" style={{ borderColor: '#ffc44d' }}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-black px-4 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#ffc44d' }}>Most Popular</div>
              <h4 className="text-xl font-semibold text-white mb-2">Professional</h4>
              <div className="text-3xl font-bold text-white mb-4">₹799<span className="text-lg font-normal text-gray-400">/month</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Up to 25 users</li>
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Advanced analytics</li>
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Team collaboration</li>
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Priority support</li>
              </ul>
              <button className="w-full text-black font-semibold px-4 py-2 rounded-lg transition-colors hover:opacity-90" style={{ backgroundColor: '#ffc44d' }}>Start Free Trial</button>
            </div>
            <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
              <h4 className="text-xl font-semibold text-white mb-2">Enterprise</h4>
              <div className="text-3xl font-bold text-white mb-4">₹1,999<span className="text-lg font-normal text-gray-400">/month</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Unlimited users</li>
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Custom integrations</li>
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Advanced security</li>
                <li className="flex items-center text-gray-300"><CheckCircleIcon className="h-4 w-4 mr-2" style={{ color: '#ffc44d' }} />Dedicated support</li>
              </ul>
              <button className="w-full border border-gray-600 text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Logo size="md" variant="dark" />
                <h3 className="text-xl font-bold text-white">TaskHive</h3>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Smart task management for modern teams. Streamline workflows, boost productivity, and achieve your goals with TaskHive.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 TaskHive. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSubmit={handleContactSubmit}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Thank You!"
        message="We will reach out to you shortly"
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default HomePage;
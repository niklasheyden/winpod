import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4">About WinPod</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              WinPod is a project by the Institute for Information Systems (WIN) at KIT, 
              making research more accessible through AI-powered audio content.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-gray-400 hover:text-white text-sm">
                  Explore Podcasts
                </Link>
              </li>
              <li>
                <Link to="/generate" className="text-gray-400 hover:text-white text-sm">
                  Generate Podcast
                </Link>
              </li>
            </ul>
          </div>

          {/* Research Groups */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4">Research Groups</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.win.kit.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  WIN Research
                </a>
              </li>
              <li>
                <a
                  href="https://h-lab.win.kit.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  h-lab
                </a>
              </li>
              <li>
                <a
                  href="https://www.kit.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  KIT
                </a>
              </li>
            </ul>
          </div>

          {/* Logos Section */}
          <div className="md:col-span-1">
            <h3 className="text-white font-semibold mb-4">Affiliated With</h3>
            <div className="flex flex-col space-y-6">
              <a 
                href="https://www.win.kit.edu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-32"
              >
                <img
                  src="/win-logo.png"
                  alt="WIN Logo"
                  className="w-full h-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
              <a 
                href="https://www.kit.edu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-32"
              >
                <img
                  src="/kit-logo.png"
                  alt="KIT Logo"
                  className="w-full h-auto brightness-0 invert opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Institute for Information Systems (WIN) at KIT
            </p>
            <div className="flex space-x-6">
              <a
                href="https://www.kit.edu/datenschutz.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="https://www.kit.edu/impressum.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm"
              >
                Imprint
              </a>
              <a
                href="https://www.kit.edu/accessibility.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm"
              >
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
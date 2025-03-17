import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-300 text-sm">
              &copy; {new Date().getFullYear()} PrintPack. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link href="/help" className="text-gray-300 hover:text-white text-sm">
              Help Center
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white text-sm">
              Contact IT Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 
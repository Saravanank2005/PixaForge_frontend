import React from 'react';

const Help = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="glass p-6 rounded-lg backdrop-blur-sm bg-white/80 shadow-xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <span className="p-2 rounded-lg bg-gradient-to-r from-teal-400 to-cyan-500 text-white mr-3 shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </span>
          Help & Support
        </h1>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-5 rounded-lg shadow-md border border-indigo-100">
            <h2 className="text-xl font-semibold mb-3 text-indigo-700">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-medium text-lg mb-2">How do I create a new project?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  To create a new project, navigate to the Projects section from the sidebar, then click on the "Create New Project" button. Fill in the required details about your project and submit the form.
                </p>
              </div>
              
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-medium text-lg mb-2">How do I message a designer?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  You can message a designer by visiting their profile and clicking on the "Message" button. Alternatively, you can go to the Messages section and start a new conversation by selecting the recipient.
                </p>
              </div>
              
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-medium text-lg mb-2">How do I upload and download files?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  You can upload files in project details or portfolio sections. Both designers and clients can download files from anywhere in the application. Files are stored securely and can be accessed by authorized users.
                </p>
              </div>
              
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="font-medium text-lg mb-2">How do I update my profile and portfolio?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  You can update your profile by clicking on your avatar in the top-right corner and selecting "Your Profile" or "Settings". From there, you can edit your personal information, skills, and upload portfolio items with images.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-5 rounded-lg shadow-md border border-teal-100">
            <h2 className="text-xl font-semibold mb-3 text-teal-700">Contact Support</h2>
            <p className="text-teal-600 mb-4">
              Need additional help? Our support team is available to assist you.
            </p>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                <input 
                  type="text" 
                  id="subject" 
                  className="w-full px-4 py-2 border border-teal-200 rounded-md focus:ring-teal-500 focus:border-teal-500 bg-white/80"
                  placeholder="What can we help you with?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                <textarea 
                  id="message" 
                  rows="4" 
                  className="w-full px-4 py-2 border border-teal-200 rounded-md focus:ring-teal-500 focus:border-teal-500 bg-white/80"
                  placeholder="Please describe your issue in detail"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium rounded-md shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

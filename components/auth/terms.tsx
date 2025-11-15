import React from "react";

const Terms = () => {
  return (
    <div className='bg-gray-100 dark:bg-gray-900 min-h-screen'>
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-4xl font-bold text-center text-gray-800 dark:text-white mb-8'>Terms of Service</h1>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-8'>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>Welcome to Harinavi Transmission Maintenance. These terms and conditions outline the rules and regulations for the use of our website.</p>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>
            By accessing this website, we assume you accept these terms and conditions. Do not continue to use Harinavi Transmission Maintenance if you do not agree to all of the terms and conditions stated on this page.
          </p>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>Intellectual Property Rights</h2>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>
            Other than the content you own, under these Terms, Harinavi Transmission Maintenance and/or its licensors own all the intellectual property rights and materials contained in this Website.
          </p>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>Restrictions</h2>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>You are specifically restricted from all of the following:</p>
          <ul className='list-disc list-inside mb-4 text-gray-700 dark:text-gray-300'>
            <li>Publishing any Website material in any other media.</li>
            <li>Selling, sublicensing and/or otherwise commercializing any Website material.</li>
            <li>Publicly performing and/or showing any Website material.</li>
            <li>Using this Website in any way that is or may be damaging to this Website.</li>
          </ul>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>No Warranties</h2>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>
            This Website is provided &quot;as is,&quot; with all faults, and Harinavi Transmission Maintenance expresses no representations or warranties, of any kind related to this Website or the materials contained on this Website.
          </p>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>Limitation of Liability</h2>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>
            In no event shall Harinavi Transmission Maintenance, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website.
          </p>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>Contact Us</h2>
          <p className='text-gray-700 dark:text-gray-300'>If you have any questions about these Terms, please contact us at support@harinavi.com.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;

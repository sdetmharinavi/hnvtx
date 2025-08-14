import React from "react";

const Privacy = () => {
  return (
    <div className='bg-gray-100 dark:bg-gray-900 min-h-screen'>
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-4xl font-bold text-center text-gray-800 dark:text-white mb-8'>Privacy Policy</h1>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-8'>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>Your privacy is important to us. It is Harinavi Transmission Maintenance's policy to respect your privacy regarding any information we may collect from you across our website.</p>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>
            We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
          </p>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>Information We Collect</h2>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>
            We may collect personal identification information from Users in a variety of ways, including, but not limited to, when Users visit our site, register on the site, and in connection with other activities, services, features or resources
            we make available on our Site.
          </p>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>How We Use Your Information</h2>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>We may use the information we collect for various purposes, including to:</p>
          <ul className='list-disc list-inside mb-4 text-gray-700 dark:text-gray-300'>
            <li>Provide, operate, and maintain our website</li>
            <li>Improve, personalize, and expand our website</li>
            <li>Understand and analyze how you use our website</li>
            <li>Develop new products, services, features, and functionality</li>
          </ul>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>Security</h2>
          <p className='mb-4 text-gray-700 dark:text-gray-300'>The security of your personal information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure.</p>

          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mt-6 mb-4'>Contact Us</h2>
          <p className='text-gray-700 dark:text-gray-300'>If you have any questions about this Privacy Policy, please contact us at support@harinavi.com.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

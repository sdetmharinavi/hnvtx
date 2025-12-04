import { ButtonSpinner } from '@/components/common/ui';
import { motion } from 'framer-motion';

// Define animation variants outside for better portability and to resolve TypeScript inference issues

const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1, // for seamless animation orchestration.
    },
  },
} as const; // Add 'as const' to enforce literal types and resolve TS errors, as variants are objects of arbitrary string keys

const bannerVariants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: 0.2,
      type: 'spring', // Specify as string literal; TypeScript may infer 'string' without 'as const', but 'spring' with stiffness/damping ensures proper typing.
      stiffness: 300,
      damping: 30,
    },
  },
} as const;

const textVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, delay: 0.4 },
  },
} as const;

const buttonVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.6,
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
} as const;

const CableNotFound = ({
  id,
  handleBackToOfcList,
  isBackClicked,
}: {
  id: string;
  handleBackToOfcList: () => void;
  isBackClicked: boolean;
}) => {
  return (
    <motion.div
      className="p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 p-4 rounded-lg shadow-lg"
        variants={bannerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex">
          <div className="shrink-0">
            <motion.svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              variants={bannerVariants}
              whileHover={{
                scale: 1.1,
                rotate: 5,
              }}
              whileTap={{ scale: 0.9 }}
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </motion.svg>
          </div>
          <div className="ml-3">
            <motion.p
              className="text-sm text-red-700 font-semibold"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              OFC cable with ID {id} not found.
            </motion.p>
            <motion.button
              onClick={handleBackToOfcList}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-2"
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
            >
              {isBackClicked ? <ButtonSpinner /> : ' Back to OFC List'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CableNotFound;

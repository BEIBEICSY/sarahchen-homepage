import { motion } from 'framer-motion';

const StatusCallout = ({ statusText }) => {
  return (
    <motion.div
      className="mt-8 text-[13px] text-white/30 font-inter tracking-[0.2em] uppercase"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 3, duration: 1, ease: "easeOut" }}
    >
      {statusText}
    </motion.div>
  );
};

export default StatusCallout;
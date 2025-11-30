import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import GamePINInput from '../components/GamePINInput';

export default function Home() {
  const [showPinInput, setShowPinInput] = useState(false);

  const features = [
    {
      icon: '❓',
      title: 'Interactive Quizzes',
      description: 'Create engaging quizzes with multiple choice questions, real-time scoring, and live leaderboards',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: '📊',
      title: 'Live Polls',
      description: 'Get instant feedback with real-time polls. Perfect for audience engagement and decision making',
      color: 'from-green-500 to-blue-500'
    },
    {
      icon: '🎁',
      title: 'Exciting Raffles',
      description: 'Run fun raffles with automatic or manual entry. Perfect for prizes and giveaways',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const steps = [
    { step: '1', title: 'Create Event', description: 'Set up your event with a name and description' },
    { step: '2', title: 'Add Activities', description: 'Add quizzes, polls, and raffles to your event' },
    { step: '3', title: 'Share PIN', description: 'Participants join using your unique event PIN' },
    { step: '4', title: 'Go Live!', description: 'Control activities in real-time and see results instantly' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="text-6xl sm:text-7xl md:text-8xl"
              >
                📦
              </motion.div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Event Box
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Create interactive events that engage your audience with 
              <span className="text-answer-yellow font-semibold"> quizzes</span>,
              <span className="text-green-400 font-semibold"> polls</span>, and
              <span className="text-pink-400 font-semibold"> raffles</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 mb-12">
              <Link
                to="/create"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-kahoot-purple bg-white hover:bg-answer-yellow hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-answer-yellow transition-all shadow-lg transform hover:scale-105"
              >
                🚀 Create Your First Event
              </Link>
              <button
                onClick={() => setShowPinInput(!showPinInput)}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-bold rounded-xl text-white bg-transparent hover:bg-white hover:text-kahoot-purple focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all shadow-lg transform hover:scale-105"
              >
                {showPinInput ? '❌ Hide PIN Input' : '🎯 Join with PIN'}
              </button>
            </div>

            {/* Game PIN Input Section */}
            {showPinInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 px-4"
              >
                <GamePINInput />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/5 backdrop-blur-sm py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need for Engaging Events
            </h2>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto">
              Event Box provides all the tools you need to create memorable interactive experiences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-3xl mb-6 mx-auto`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-white/80 text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-answer-yellow to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold text-kahoot-purple mb-6 mx-auto">
                  {step.step}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/70 text-sm sm:text-base">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/5 backdrop-blur-sm py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl sm:text-5xl font-bold text-answer-yellow mb-2">∞</div>
              <div className="text-white/80">Unlimited Events</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl sm:text-5xl font-bold text-green-400 mb-2">⚡</div>
              <div className="text-white/80">Real-time Results</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl sm:text-5xl font-bold text-pink-400 mb-2">📱</div>
              <div className="text-white/80">Mobile Friendly</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Create Amazing Events?
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of organizers who use Event Box to create engaging, interactive experiences
            </p>
            <Link
              to="/create"
              className="inline-flex items-center justify-center px-8 py-4 text-xl font-bold rounded-xl text-kahoot-purple bg-gradient-to-r from-answer-yellow to-orange-500 hover:from-orange-500 hover:to-answer-yellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-answer-yellow transition-all shadow-lg transform hover:scale-105"
            >
              🎉 Start Creating Now - It's Free!
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * AnswerStatisticsChart Component
 * 
 * Displays a bar chart visualization of answer distribution after a question ends.
 * Shows the count and percentage of participants who selected each option,
 * with the correct answer highlighted.
 * 
 * Requirements: 14.3, 14.4, 20.2
 */
import { motion } from 'framer-motion';
import { AnswerStatistics, Question } from '../types/models';

interface AnswerStatisticsChartProps {
  statistics: AnswerStatistics;
  question: Question;
}

export default function AnswerStatisticsChart({
  statistics,
  question,
}: AnswerStatisticsChartProps) {
  // Find the maximum count to scale bars appropriately
  const maxCount = Math.max(
    ...Object.values(statistics.optionCounts).map(opt => opt.count),
    1 // Ensure at least 1 to avoid division by zero
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
        Answer Distribution
      </h3>
      <div className="space-y-3">
        {question.options.map(option => {
          const optionStats = statistics.optionCounts[option.id] || {
            count: 0,
            percentage: 0,
          };
          const isCorrect = option.id === statistics.correctOptionId;
          const barWidth = maxCount > 0 ? (optionStats.count / maxCount) * 100 : 0;

          return (
            <div key={option.id} className="space-y-1">
              {/* Option text and stats */}
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      isCorrect ? 'text-green-700' : 'text-gray-700'
                    }`}
                  >
                    {option.text}
                  </span>
                  {isCorrect && (
                    <span className="text-green-600 font-bold text-xs bg-green-100 px-2 py-0.5 rounded">
                      ✓ Correct
                    </span>
                  )}
                </div>
                <span className="text-gray-600 font-medium">
                  {optionStats.count} ({optionStats.percentage.toFixed(1)}%)
                </span>
              </div>

              {/* Bar chart */}
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isCorrect
                      ? 'bg-gradient-to-r from-green-400 to-green-600'
                      : 'bg-gradient-to-r from-blue-400 to-blue-600'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total responses */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Total Responses: {statistics.totalResponses}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Percent, Banknote, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfitSplit() {
  const [profitAmount, setProfitAmount] = useState<number>(10000);
  const [splitPercent, setSplitPercent] = useState<number>(80);

  const traderShare = (profitAmount * (splitPercent / 100)).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const firmShare = (profitAmount * ((100 - splitPercent) / 100)).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div id="profit-split" className="scroll-section min-h-[80vh] flex flex-col items-center justify-center gap-12 py-16 px-4">
      <motion.div 
        className="text-center max-w-3xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={itemVariants}
      >
        <span className="text-accent-cyan text-sm font-semibold uppercase tracking-widest">Profit Sharing Model</span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mt-2 mb-4 tracking-tight">
          Industry-Leading Payout Splits
        </h2>
        <p className="text-text-secondary text-lg leading-relaxed">
          We don't charge hidden fees or take risk on your trading style. Earn simulated profits, request withdrawals, and keep your hard-earned share.
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl items-center mt-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Visual Calculations card */}
        <motion.div 
          variants={itemVariants}
          className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-3xl p-8 flex flex-col gap-8 shadow-2xl"
        >
          <h3 className="text-xl font-semibold text-text-primary">Payout Calculator</h3>
          
          {/* Target Profits Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-text-secondary text-sm">
              <span>Target Profit Amount:</span>
              <strong className="text-text-primary">${profitAmount.toLocaleString()}</strong>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="100000" 
              step="1000"
              value={profitAmount}
              onChange={(e) => setProfitAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-cyan hover:accent-cyan-400 transition-colors"
            />
          </div>

          {/* Toggle Splits */}
          <div className="flex flex-col gap-3">
            <span className="text-text-secondary text-sm">Choose Payout Tier:</span>
            <div className="flex bg-white/5 border border-glass-border rounded-xl p-1 gap-2">
              {[80, 90].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSplitPercent(tier)}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    splitPercent === tier 
                      ? 'bg-accent-cyan text-black shadow-lg shadow-accent-cyan/20' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {tier}% Split {tier === 90 ? '(Scale Path)' : '(Default)'}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-glass-border" />

          {/* Outputs */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-secondary uppercase tracking-wider">Your Share ({splitPercent}%)</span>
              <span className="text-3xl font-bold text-accent-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                {traderShare}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-secondary uppercase tracking-wider">Firm Share ({100 - splitPercent}%)</span>
              <span className="text-3xl font-bold text-text-primary">{firmShare}</span>
            </div>
          </div>
        </motion.div>

        {/* Written explanation */}
        <div className="flex flex-col gap-8">
          <motion.div variants={itemVariants} className="flex gap-4 items-start">
            <div className="text-accent-cyan p-3 bg-cyan-500/10 rounded-xl">
              <Percent size={24} />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-1">Consistent Profit Retainers</h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                We believe in rewarding the trader for their performance. We start everyone at an 80% split. No strings attached, no minimum profit rules to withdraw.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-4 items-start">
            <div className="text-purple-400 p-3 bg-purple-500/10 rounded-xl">
              <Banknote size={24} />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-1">Bi-weekly Withdrawals</h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                Withdrawals are available every 14 days. Once requested, your funds are disbursed in crypto (USDT/USDC) or wire transfers within 24 hours.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex gap-4 items-start">
            <div className="text-blue-400 p-3 bg-blue-500/10 rounded-xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-text-primary mb-1">Zero Account Liabilities</h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                Should you experience a market event resulting in a drawdown breach, you are never liable for losses. We absorb all simulated market liabilities.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

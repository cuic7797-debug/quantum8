import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCheckin } from '@/hooks/useCheckin';
import Collapsible from '@/components/common/Collapsible';
import { useNavigate } from 'react-router-dom';
import { Check, MessageCircle, CreditCard, Star } from 'lucide-react';

interface PointPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  originalPrice?: number;
  badge?: string;
  icon: string;
  color: string;
  popular?: boolean;
}

const PACKAGES: PointPackage[] = [
  { id: 'starter', name: '体验包', points: 100, price: 5, icon: '⭐', color: '#3b82f6' },
  { id: 'basic', name: '基础包', points: 500, price: 19, icon: '🔥', color: '#f59e0b', popular: true, badge: '最划算' },
  { id: 'pro', name: '专业包', points: 1200, price: 39, originalPrice: 60, icon: '💎', color: '#8b5cf6' },
  { id: 'ultimate', name: '至尊包', points: 3000, price: 79, originalPrice: 150, icon: '👑', color: '#ef4444', badge: '超值' },
];

type PaymentMethod = 'wechat' | 'alipay';

export default function PointsStorePage() {
  const { user } = useAuth();
  const { points } = useCheckin();
  const navigate = useNavigate();
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  function selectPackage(pkg: PointPackage) {
    setSelectedPkg(pkg.id);
    setPaymentMethod(null);
    setShowPayment(true);
  }

  function confirmPayment() {
    setShowPayment(false);
    setPaymentMethod(null);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 4000);
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-5xl">🔐</div>
        <div className="text-xl text-[var(--color-muted)]">请先登录后购买积分</div>
        <button onClick={() => navigate('/auth')} className="btn-primary text-base px-8 py-3">去登录</button>
      </div>
    );
  }

  const selected = PACKAGES.find(p => p.id === selectedPkg);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text-primary">积分商城</h2>
        <div className="flex items-center gap-2 glass-card px-4 py-2">
          <Star size={16} className="text-amber-400" />
          <span className="text-lg font-bold">{points?.total_points || 0}</span>
          <span className="text-sm text-[var(--color-muted)]">积分</span>
        </div>
      </div>

      {/* Point Packages */}
      <div className="grid grid-cols-2 gap-4">
        {PACKAGES.map(pkg => (
          <button key={pkg.id} onClick={() => selectPackage(pkg)}
            className={`glass-card p-5 text-left relative transition-all hover:scale-[1.02] ${
              selectedPkg === pkg.id ? 'ring-2 ring-[var(--color-primary)]' : ''
            } ${pkg.popular ? 'border-[var(--color-primary)]/30' : ''}`}>
            {pkg.badge && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: pkg.color }}>
                {pkg.badge}
              </div>
            )}
            <div className="text-3xl mb-3">{pkg.icon}</div>
            <div className="text-base font-bold mb-1">{pkg.name}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: pkg.color }}>
              {pkg.points}
              <span className="text-sm font-normal text-[var(--color-muted)] ml-1">积分</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">¥{pkg.price}</span>
              {pkg.originalPrice && (
                <span className="text-sm text-[var(--color-muted)] line-through">¥{pkg.originalPrice}</span>
              )}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">
              约 ¥{(pkg.price / pkg.points * 10).toFixed(1)}/百积分
            </div>
          </button>
        ))}
      </div>

      {/* Payment Modal */}
      {showPayment && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPayment(false)}>
          <div className="glass-card w-96 max-w-[90vw] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">确认购买</h3>
              <button onClick={() => setShowPayment(false)} className="text-[var(--color-muted)] hover:text-white text-xl leading-none">✕</button>
            </div>

            {/* Package Info */}
            <div className="glass-inset p-4 rounded-xl mb-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selected.icon}</span>
                <div>
                  <div className="text-base font-bold">{selected.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">{selected.points} 积分</div>
                </div>
                <div className="ml-auto text-xl font-bold" style={{ color: selected.color }}>¥{selected.price}</div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {!paymentMethod && (
              <div className="space-y-3 mb-4">
                <div className="text-sm font-semibold text-[var(--color-muted)]">选择支付方式</div>

                <button onClick={() => setPaymentMethod('wechat')}
                  className="w-full flex items-center gap-3 p-4 glass-inset rounded-xl hover:bg-white/[0.05] transition-all">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={22} className="text-emerald-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-base font-semibold">微信支付</div>
                    <div className="text-sm text-[var(--color-muted)]">扫描微信收款码</div>
                  </div>
                  <div className="text-lg">→</div>
                </button>

                <button onClick={() => setPaymentMethod('alipay')}
                  className="w-full flex items-center gap-3 p-4 glass-inset rounded-xl hover:bg-white/[0.05] transition-all">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <CreditCard size={22} className="text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-base font-semibold">支付宝</div>
                    <div className="text-sm text-[var(--color-muted)]">扫描支付宝收款码</div>
                  </div>
                  <div className="text-lg">→</div>
                </button>
              </div>
            )}

            {/* QR Code - Only show after method selected, no borders */}
            {paymentMethod && (
              <div className="flex flex-col items-center mb-4">
                <img
                  src={paymentMethod === 'wechat' ? '/wechat-pay.png' : '/alipay-pay.jpg'}
                  alt={paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                  className="w-56 h-56 object-contain rounded-lg"
                />
                <div className="text-sm text-[var(--color-muted)] mt-3">
                  请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付 ¥{selected.price}
                </div>
                <button onClick={() => setPaymentMethod(null)}
                  className="text-xs text-[var(--color-primary)] mt-1 hover:underline">
                  更换支付方式
                </button>
              </div>
            )}

            {/* Confirm Button */}
            <button onClick={confirmPayment} className="w-full btn-primary text-base py-3">
              我已付款
            </button>

            <div className="text-xs text-center text-[var(--color-muted)] mt-3">
              付款后请截图发给管理员确认，24小时内到账
            </div>
          </div>
        </div>
      )}

      {/* Confirm Toast */}
      {showConfirm && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-card px-6 py-4 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Check size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-base font-bold">订单已提交</div>
              <div className="text-sm text-[var(--color-muted)]">管理员将在24小时内处理</div>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <Collapsible title="购买说明" step={1} defaultOpen={false}>
        <div className="space-y-3">
          {[
            { step: '1', title: '选择积分包', desc: '选择适合您的积分套餐' },
            { step: '2', title: '扫码支付', desc: '使用微信或支付宝扫码付款' },
            { step: '3', title: '确认到账', desc: '付款后点击"我已付款"，管理员确认后积分到账' },
            { step: '4', title: '开始使用', desc: '用积分解锁高级功能' },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-3 glass-inset p-3 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-sm font-bold text-[var(--color-primary)]">
                {item.step}
              </div>
              <div>
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-sm text-[var(--color-muted)]">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Points Usage */}
      <Collapsible title="积分用途" step={2}>
        <div className="space-y-2">
          {[
            { action: '智能选号', points: 5, icon: '🎯' },
            { action: 'AI策略生成', points: 10, icon: '🧠' },
            { action: 'AI分析报告', points: 20, icon: '📊' },
            { action: '策略回测', points: 10, icon: '🔬' },
            { action: '号码预测评分', points: 8, icon: '🔮' },
            { action: '杀号工具', points: 3, icon: '🔪' },
          ].map(rule => (
            <div key={rule.action} className="flex items-center justify-between glass-inset p-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{rule.icon}</span>
                <span className="text-sm font-semibold">{rule.action}</span>
              </div>
              <span className="text-sm font-bold text-amber-400">-{rule.points} 积分</span>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

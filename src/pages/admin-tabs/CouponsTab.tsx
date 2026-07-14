import type { Dispatch, SetStateAction } from 'react';
import { Plus, Trash } from 'lucide-react';
import type { CouponItem } from '../../lib/adminApi';
import { labelStyle, inputStyle, selectStyle } from './styles';

export interface CouponsTabProps {
  handleAddCoupon: (e: React.FormEvent) => void;
  couponCode: string;
  setCouponCode: Dispatch<SetStateAction<string>>;
  couponType: 'PERCENT';
  setCouponType: Dispatch<SetStateAction<'PERCENT'>>;
  couponDiscount: number;
  setCouponDiscount: Dispatch<SetStateAction<number>>;
  couponLimit: number;
  setCouponLimit: Dispatch<SetStateAction<number>>;
  couponExpiry: string;
  setCouponExpiry: Dispatch<SetStateAction<string>>;
  coupons: CouponItem[];
  handleDeleteCoupon: (code: string) => void;
}

export default function CouponsTab({
  handleAddCoupon,
  couponCode, setCouponCode,
  couponType, setCouponType,
  couponDiscount, setCouponDiscount,
  couponLimit, setCouponLimit,
  couponExpiry, setCouponExpiry,
  coupons,
  handleDeleteCoupon,
}: CouponsTabProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
      <div style={{
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        borderRadius: '24px', padding: '2rem', height: 'fit-content'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Create Promo Code</h3>
        <form onSubmit={handleAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}>Coupon Name (Code)</label>
            <input type="text" placeholder="e.g. FIFTYOFF" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} style={inputStyle} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Discount Type</label>
              <select value={couponType} onChange={(e) => setCouponType(e.target.value as any)} style={selectStyle} disabled>
                <option value="PERCENT">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Discount Value</label>
              <input type="number" min={1} value={couponDiscount} onChange={(e) => setCouponDiscount(Number(e.target.value))} style={inputStyle} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Usage Limit</label>
              <input type="number" min={1} value={couponLimit} onChange={(e) => setCouponLimit(Number(e.target.value))} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date</label>
              <input type="date" value={couponExpiry} onChange={(e) => setCouponExpiry(e.target.value)} style={inputStyle} required />
            </div>
          </div>
          <button type="submit" className="neon-button" style={{
            padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start', marginTop: '0.5rem'
          }}>
            <Plus size={16} /> Deploy Promo Code
          </button>
        </form>
      </div>

      <div style={{
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        borderRadius: '24px', padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Active Promo Codes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }} className="custom-scrollbar">
          {coupons.map((c) => (
            <div key={c.code} style={{
              background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)',
              borderRadius: '12px', padding: '1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{c.code}</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {c.discountType === 'PERCENT' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`} • Exp: {new Date(c.validUntil).toLocaleDateString()}
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Used: {c.usedCount} / {c.maxUsage || '∞'} times
                </p>
              </div>
              <button onClick={() => handleDeleteCoupon(c.code)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                <Trash size={18} />
              </button>
            </div>
          ))}
          {coupons.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No promo codes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

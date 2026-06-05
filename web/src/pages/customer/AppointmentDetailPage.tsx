import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../api/appointment.api';
import { useTranslation } from '../../hooks/useTranslation';
import { formatCurrency, formatDate, formatTime, getStatusClass } from '../../utils/format';
import { Appointment } from '../../types';

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await appointmentApi.getAppointmentById(id);
        setAppt(res.data || res);
      } catch {
        setAppt(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleCancel = async () => {
    if (!appt || !confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) return;
    try {
      setCancelling(true);
      await appointmentApi.updateAppointmentStatus(appt._id, 'CANCELLED');
      setAppt((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
    } catch {
      alert('Hủy lịch hẹn thất bại.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReview = async () => {
    if (!appt || !comment.trim()) { setReviewError('Vui lòng nhập nhận xét.'); return; }
    try {
      setReviewing(true);
      await appointmentApi.submitReview({ appointmentId: appt._id, rating, comment });
      setReviewSubmitted(true);
      setComment('');
    } catch {
      setReviewError('Gửi đánh giá thất bại.');
    } finally {
      setReviewing(false);
    }
  };

  const shop = appt?.shopId as any;
  const barber = appt?.barberId as any;
  const services = appt?.serviceIds as any[];

  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', NO_SHOW: 'Không đến',
  };

  if (loading) return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Quay lại</button>
      </div>
      <div className="spinner-wrap"><div className="spinner" /></div>
    </div>
  );

  if (!appt) return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Quay lại</button>
      </div>
      <div className="empty-state">
        <div className="empty-icon-bg">📅</div>
        <div className="empty-title">Không tìm thấy lịch hẹn</div>
      </div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Quay lại</button>
        <span className={`badge ${getStatusClass(appt.status)}`}>{STATUS_LABEL[appt.status]}</span>
      </div>

      {/* Shop info */}
      <div className="detail-section">
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-headline)', color: 'var(--color-primary)', marginBottom: 4 }}>
          {typeof shop === 'object' && shop ? (shop.name as string) : 'Barbershop'}
        </div>
        {typeof shop === 'object' && shop && (shop.address as string) && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            📍 {shop.address as string}
          </div>
        )}

        <div className="detail-label">Chi tiết lịch hẹn</div>
        <div className="detail-row">
          <span>📅</span>
          <span>{formatDate(appt.bookingDate || (appt as any).date)}</span>
        </div>
        <div className="detail-row">
          <span>🕐</span>
          <span>{formatTime(appt.bookingDate || (appt as any).date)}</span>
        </div>
        {barber && typeof barber === 'object' && (barber.fullName as string) && (
          <div className="detail-row">
            <span>✂️</span>
            <span>{barber.fullName as string}</span>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Services */}
      {services && services.length > 0 && (
        <div className="detail-section">
          <div className="detail-label">Dịch vụ</div>
          {services.map((s, i) => (
            <div key={i} className="detail-row" style={{ justifyContent: 'space-between' }}>
              <span>{(s.name as string) || 'Dịch vụ'}</span>
              {(s.price as number) > 0 && (
                <span style={{ fontWeight: 700 }}>{formatCurrency(s.price as number)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="divider" />

      {/* Total */}
      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Tổng cộng</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>
            {formatCurrency(appt.totalPrice)}
          </span>
        </div>
      </div>

      {appt.note && (
        <>
          <div className="divider" />
          <div className="detail-section">
            <div className="detail-label">Ghi chú</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{appt.note}</p>
          </div>
        </>
      )}

      {/* Actions */}
      {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
        <div className="detail-section" style={{ paddingTop: 20 }}>
          <button
            className="btn btn-outline btn-full"
            style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Đang hủy...' : 'Hủy lịch hẹn'}
          </button>
        </div>
      )}

      {/* Review section */}
      {appt.status === 'COMPLETED' && !reviewSubmitted && (
        <>
          <div className="divider" style={{ marginTop: 8 }} />
          <div className="detail-section">
            <div className="detail-label">Đánh giá của bạn</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: star <= rating ? 'var(--color-secondary)' : 'var(--border)' }}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="input"
              placeholder="Chia sẻ trải nghiệm của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              style={{ resize: 'none', marginBottom: 12 }}
            />
            {reviewError && <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 8 }}>{reviewError}</div>}
            <button className="btn btn-primary btn-full" onClick={handleReview} disabled={reviewing}>
              {reviewing ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </>
      )}

      {reviewSubmitted && (
        <div className="detail-section">
          <div style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 700, padding: '16px 0' }}>
            ✅ Cảm ơn bạn đã đánh giá!
          </div>
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

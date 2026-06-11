import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopApi } from '../../api/shop.api';
import { appointmentApi } from '../../api/appointment.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Shop, Service, Barber, TimeSlot } from '../../types';
import { formatCurrency, formatDate, getNext7Days, toDateStr } from '../../utils/format';

export default function BookingPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  
  const days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState<string>(days[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [note, setNote] = useState('');

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkActive = async () => {
      try {
        if (isMounted) setCheckingActive(true);
        const res = await appointmentApi.getMyAppointments();
        const all = Array.isArray(res) ? res : (res.data || res.metadata || []);
        const active = all.find((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED');
        
        if (isMounted) {
          if (active) {
            setActiveBooking(active);
            // Dùng setTimeout để tránh bị block render bởi window.confirm
            setTimeout(() => {
              if (window.confirm(`Bạn đang có lịch đặt chưa hoàn thành (Trạng thái: ${active.status}).\n\nBạn cần hoàn thành hoặc hủy lịch hiện tại trước khi tiếp tục đặt lịch mới.\n\nĐến trang Lịch hẹn?`)) {
                navigate('/appointments', { replace: true });
              }
            }, 100);
          } else {
            setActiveBooking(null);
          }
        }
      } catch (err) {
        if (isMounted) setActiveBooking(null);
      } finally {
        if (isMounted) setCheckingActive(false);
      }
    };
    checkActive();
    return () => { isMounted = false; };
  }, [navigate]);

  useEffect(() => {
    if (!shopId) return;
    const fetchInit = async () => {
      try {
        setLoadingInit(true);
        const [shopRes, svcRes] = await Promise.all([
          shopApi.getShopDetails(shopId),
          shopApi.getShopServices(shopId),
        ]);
        setShop(shopRes.data || shopRes.metadata || shopRes);
        setServices(Array.isArray(svcRes) ? svcRes : (svcRes.data || svcRes.metadata || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInit(false);
      }
    };
    fetchInit();
  }, [shopId]);

  useEffect(() => {
    if (!shopId || step !== 2) return;
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await shopApi.getShopSlots(shopId, selectedDate);
        const raw = Array.isArray(res) ? res : res.slots || res.data?.slots || res.data || res.metadata || [];
        setSlots(raw);
        setSelectedTime(''); // reset time on date change
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [shopId, selectedDate, step]);

  const toggleService = (svc: Service) => {
    setSelectedServices(prev => 
      prev.find(s => s._id === svc._id) ? prev.filter(s => s._id !== svc._id) : [...prev, svc]
    );
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const handleSubmit = async () => {
    if (!shopId || !selectedTime) return;
    try {
      setSubmitting(true);
      const bookingDate = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      await appointmentApi.createAppointment({
        shopId,
        serviceIds: selectedServices.map(s => s._id),
        barberId: null,
        bookingDate,
        note,
      });
      alert(t('booking.bookingSuccessMsg'));
      navigate('/appointments', { replace: true });
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || t('booking.bookFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInit || checkingActive) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
          ← {t('common.back')}
        </button>
        <div className="page-title">{t('booking.title')}</div>
      </div>

      {/* Wizard Header */}
      <div className="wizard-steps">
        <div className={`wizard-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
          <div className="step-num">1</div> <span>{t('booking.step1')}</span>
        </div>
        <div className={`step-connector ${step > 1 ? 'done' : ''}`} />
        <div className={`wizard-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
          <div className="step-num">2</div> <span>{t('booking.step2')}</span>
        </div>
        <div className={`step-connector ${step > 2 ? 'done' : ''}`} />
        <div className={`wizard-step ${step === 3 ? 'active' : ''}`}>
          <div className="step-num">3</div> <span>{t('booking.step3')}</span>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t('booking.selectService')}</h2>
            <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '0 16px', marginBottom: 24 }}>
              {services.map(svc => {
                const isSelected = !!selectedServices.find(s => s._id === svc._id);
                return (
                  <div key={svc._id} className="service-item" onClick={() => toggleService(svc)}>
                    <div className={`service-check ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span style={{ color: '#fff', fontSize: 14 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{svc.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{svc.duration} {t('booking.mins')}</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(svc.price)}</div>
                  </div>
                );
              })}
            </div>



            <div style={{ position: 'sticky', bottom: 0, padding: 20, background: 'var(--surface)', borderTop: '1px solid var(--border)', zIndex: 100, marginLeft: -24, marginRight: -24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{selectedServices.length} dịch vụ ({totalDuration}p)</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>{formatCurrency(totalPrice)}</span>
              </div>
              <button 
                className="btn btn-primary btn-full btn-lg" 
                disabled={selectedServices.length === 0 || !!activeBooking}
                onClick={() => setStep(2)}
              >
                Tiếp tục
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t('booking.selectDate')}</h2>
            <div className="date-scroll" style={{ padding: '0 0 16px 0' }}>
              {days.map(d => {
                const dateObj = new Date(d);
                const dayName = dateObj.toLocaleDateString('vi-VN', { weekday: 'short' });
                const dayNum = dateObj.getDate();
                const isActive = selectedDate === d;
                return (
                  <div key={d} className={`date-item ${isActive ? 'active' : ''}`} onClick={() => setSelectedDate(d)}>
                    <div className="date-day">{dayName}</div>
                    <div className="date-num">{dayNum}</div>
                  </div>
                );
              })}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t('booking.selectTime')}</h2>
            {loadingSlots ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : slots.length === 0 ? (
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Không có khung giờ trống.</div>
            ) : (
              <div className="slots-grid">
                {slots.map((s, i) => (
                  <button 
                    key={i} 
                    className={`slot-btn ${selectedTime === s.time ? 'selected' : ''}`}
                    disabled={!s.available}
                    onClick={() => setSelectedTime(s.time)}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}

            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>{t('booking.note')}</h2>
            <textarea
              className="input"
              rows={3}
              placeholder={t('booking.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ resize: 'none' }}
            />

            <div style={{ position: 'sticky', bottom: 0, padding: 20, background: 'var(--surface)', borderTop: '1px solid var(--border)', zIndex: 100, marginLeft: -24, marginRight: -24 }}>
              <button 
                className="btn btn-primary btn-full btn-lg" 
                disabled={!selectedTime}
                onClick={() => setStep(3)}
              >
                Tiếp tục
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>{t('booking.summary')}</h2>
            
            <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{shop?.name}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>Thời gian:</span>
                <span style={{ fontWeight: 600 }}>{formatDate(selectedDate)} - {selectedTime}</span>
              </div>
              


              <div className="divider" style={{ margin: '0 -20px 16px' }} />

              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Dịch vụ:</div>
              {selectedServices.map(s => (
                <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span>{s.name}</span>
                  <span>{formatCurrency(s.price)}</span>
                </div>
              ))}

              <div className="divider" style={{ margin: '16px -20px' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{t('booking.total')}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div style={{ position: 'sticky', bottom: 0, padding: 20, background: 'var(--surface)', borderTop: '1px solid var(--border)', zIndex: 100, marginLeft: -24, marginRight: -24 }}>
              <button 
                className="btn btn-primary btn-full btn-lg" 
                onClick={handleSubmit}
                disabled={submitting || !!activeBooking}
              >
                {submitting ? 'Đang xử lý...' : t('booking.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

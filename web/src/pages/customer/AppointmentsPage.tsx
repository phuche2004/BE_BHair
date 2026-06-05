import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi } from '../../api/appointment.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Appointment } from '../../types';
import { formatCurrency, formatDate, formatTime, getStatusClass } from '../../utils/format';

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await appointmentApi.getMyAppointments();
        setAppointments(res.data || res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (!user) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">{t('appointments.title')}</div></div>
        <div className="empty-state">
          <div className="empty-icon-bg">🔒</div>
          <div className="empty-title">Vui lòng đăng nhập</div>
          <div className="empty-sub">Bạn cần đăng nhập để xem lịch hẹn của mình.</div>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>Đăng nhập ngay</button>
        </div>
      </div>
    );
  }

  const upcomingStatuses = ['PENDING', 'CONFIRMED'];
  const upcoming = appointments.filter(a => upcomingStatuses.includes(a.status));
  const past = appointments.filter(a => !upcomingStatuses.includes(a.status));
  const displayList = activeTab === 'UPCOMING' ? upcoming : past;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="brand">B_Hair</div>
          <div className="brand-divider" />
          <div className="page-title">{t('appointments.title')}</div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'UPCOMING' ? 'active' : ''}`}
          onClick={() => setActiveTab('UPCOMING')}
        >
          {t('appointments.upcoming')} ({upcoming.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'PAST' ? 'active' : ''}`}
          onClick={() => setActiveTab('PAST')}
        >
          {t('appointments.past')} ({past.length})
        </button>
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : displayList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-bg">📅</div>
            <div className="empty-title">{t('appointments.noHistory')}</div>
            <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
              Đặt lịch ngay
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayList.map(appt => {
              const shop = appt.shopId as any;
              const shopName = (shop?.name as string) || 'Barbershop';
              const services = appt.serviceIds as any[];
              const serviceNames = services?.map(s => s.name).join(', ') || t('common.notSelected');
              
              const STATUS_LABEL: Record<string, string> = {
                PENDING: t('appointments.status.PENDING'),
                CONFIRMED: t('appointments.status.CONFIRMED'),
                COMPLETED: t('appointments.status.COMPLETED'),
                CANCELLED: t('appointments.status.CANCELLED'),
                NO_SHOW: t('appointments.status.NO_SHOW'),
              };

              const dateStr = appt.bookingDate || (appt as any).date;

              return (
                <div 
                  key={appt._id} 
                  className="card" 
                  style={{ padding: 16, cursor: 'pointer', border: '1px solid var(--border)' }}
                  onClick={() => navigate(`/appointments/${appt._id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>{shopName}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{serviceNames}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${getStatusClass(appt.status)}`}>
                        {STATUS_LABEL[appt.status]}
                      </span>
                    </div>
                  </div>
                  <div className="divider" style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <span style={{ marginRight: 8 }}>📅 {formatDate(dateStr)}</span>
                      <span>🕐 {formatTime(dateStr)}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatCurrency(appt.totalPrice)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

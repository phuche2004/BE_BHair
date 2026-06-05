import React, { useState, useEffect } from 'react';
import { appointmentApi } from '../../api/appointment.api';
import { shopApi } from '../../api/shop.api';
import { useAuthStore } from '../../store/useAuthStore';
import { Appointment, TimeSlot } from '../../types';
import { getNext7Days, getStatusClass } from '../../utils/format';

export default function StaffAppointmentsPage() {
  const { user } = useAuthStore();
  const shopId = user?.shopId;

  const days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState<string>(days[0]);
  
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    if (!shopId) return;
    try {
      setLoading(true);
      const [slotsRes, apptRes] = await Promise.all([
        shopApi.getShopSlots(shopId, selectedDate),
        appointmentApi.getShopAppointments(shopId),
      ]);
      const rawSlots = Array.isArray(slotsRes) ? slotsRes : slotsRes.slots || slotsRes.data?.slots || slotsRes.data || slotsRes.metadata || [];
      setSlots(rawSlots);
      const allAppts = Array.isArray(apptRes) ? apptRes : apptRes.data || apptRes.metadata || [];
      
      const filtered = allAppts.filter((a: Appointment) => {
        const d = a.bookingDate || (a as Record<string, string>).date;
        const bId = typeof a.barberId === 'object' ? a.barberId?._id : a.barberId;
        // Staff can only see their own appts + any appt on selected date
        return d && d.startsWith(selectedDate) && (bId === user?._id || !bId);
      });
      setAppointments(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [shopId, selectedDate]);

  const updateStatus = async (id: string, status: string) => {
    try {
      setLoading(true);
      await appointmentApi.updateAppointmentStatus(id, status);
      fetchAll();
    } catch (err) {
      alert('Cập nhật thất bại');
      setLoading(false);
    }
  };

  const apptsByTime: Record<string, Appointment[]> = {};
  appointments.forEach(a => {
    const d = a.bookingDate || (a as Record<string, string>).date;
    let time = a.startTime || '00:00';
    if (d) {
      const dateObj = new Date(d);
      time = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (!apptsByTime[time]) apptsByTime[time] = [];
    apptsByTime[time].push(a);
  });

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="brand">B_Hair</div>
          <div className="brand-divider" />
          <div className="page-title">Lịch hẹn của tôi</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchAll} disabled={loading}>
          {loading ? '...' : 'Tải lại'}
        </button>
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        <div className="date-scroll" style={{ padding: '0 0 16px 0', margin: '0 -20px', paddingLeft: 20 }}>
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

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : slots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-bg">📅</div>
            <div className="empty-title">Không có khung giờ</div>
          </div>
        ) : (
          <div className="timeline">
            {slots.map((slot, index) => {
              const slotAppts = apptsByTime[slot.time] || [];
              return (
                <div key={index} className="time-slot">
                  <div className="time-col">
                    <div className="time-label">{slot.time}</div>
                  </div>
                  <div className="slot-content">
                    {slotAppts.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--outline)', paddingTop: 10 }}>Trống</div>
                    ) : (
                      slotAppts.map(a => {
                        const services = a.serviceIds as Record<string, unknown>[];
                        const serviceNames = services?.map(s => s.name).join(', ') || 'Dịch vụ';
                        const customerName = a.customerName || (a.customerId as Record<string, string>)?.fullName || 'Khách hàng';
                        
                        return (
                          <div key={a._id} className="appt-card" style={{ flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>{customerName}</span>
                              <span className={`badge ${getStatusClass(a.status)}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                                {a.status}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{serviceNames}</div>
                            
                            {a.status === 'CONFIRMED' && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <button className="btn btn-outline btn-sm" style={{ flex: 1, padding: '6px 0' }} onClick={() => updateStatus(a._id, 'COMPLETED')}>
                                  Hoàn thành
                                </button>
                                <button className="btn btn-outline btn-sm" style={{ flex: 1, padding: '6px 0', borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => updateStatus(a._id, 'NO_SHOW')}>
                                  Không đến
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
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

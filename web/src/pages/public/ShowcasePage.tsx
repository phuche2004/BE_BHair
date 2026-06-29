import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import './ShowcasePage.css';
import './LandingPage.css';
import { ParticlesBackground } from '../../components/ui/ParticlesBackground';
// ─── Time formatter ───────────────────────────────────
const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function ShowcasePage() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const clickSfxRef = useRef<HTMLAudioElement>(null);
  const whooshSfxRef = useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(true);

  // ─── Audio Logic ──────────────────────────────────────
  const playClick = () => {
    if (!muted && clickSfxRef.current) {
      clickSfxRef.current.volume = 0.4;
      clickSfxRef.current.currentTime = 0;
      clickSfxRef.current.play().catch(() => { });
    }
  };

  const playWhoosh = () => {
    if (!muted && whooshSfxRef.current) {
      whooshSfxRef.current.volume = 0.4;
      whooshSfxRef.current.currentTime = 0;
      whooshSfxRef.current.play().catch(() => { });
    }
  };

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = 0.25; // Set to 15% because 50% is still very loud log-wise
      bgmRef.current.muted = muted;
      if (!muted && playing) bgmRef.current.play().catch(() => { });
    }
  }, [muted]);

  useEffect(() => {
    if (bgmRef.current) {
      if (playing && !muted) bgmRef.current.play().catch(() => { });
      else bgmRef.current.pause();
    }
  }, [playing]);

  // Refs for scrolling
  const sLandingRef = useRef<HTMLDivElement>(null);
  const sLoginRef = useRef<HTMLDivElement>(null);
  const sHomeRef = useRef<HTMLDivElement>(null);
  const sShopRef = useRef<HTMLDivElement>(null);
  const sBookingRef = useRef<HTMLDivElement>(null);
  const sSearchRef = useRef<HTMLDivElement>(null);

  // ─── GSAP Master Timeline ────────────────────────────
  useEffect(() => {
    if (!wrapperRef.current) return;
    const wrapper = wrapperRef.current;
    const labelEl = wrapper.querySelector('.scene-label') as HTMLElement;
    const subEl = wrapper.querySelector('.scene-sublabel') as HTMLElement;
    const labelWrap = wrapper.querySelector('.scene-label-wrap') as HTMLElement;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onUpdate: () => setProgress(tl.progress()),
      });

      const showScene = (sel: string, prevSel?: string) => {
        tl.addLabel(`trans-${sel}`);
        tl.call(() => playWhoosh(), undefined, `trans-${sel}`);

        // If there's a previous scene, fade it out at the same time
        if (prevSel) {
          tl.to(prevSel, { opacity: 0, duration: 0.8 }, `trans-${sel}`);
          tl.set(prevSel, { display: 'none' }, `trans-${sel}+=0.8`);
        }

        tl.set(sel, { display: 'block', scrollTop: 0, opacity: 0 }, `trans-${sel}`)
          .to(sel, { opacity: 1, duration: 0.8 }, `trans-${sel}`);

        tl.call(() => {
          const badge = document.querySelector('.sc-badge');
          if (badge) badge.classList.remove('is-after');
        }, undefined, `trans-${sel}`);
        tl.to('.sc-badge', { opacity: 1, duration: 0.8 }, `trans-${sel}`);
      };

      const hideScene = (sel: string) => {
        tl.to(sel, { opacity: 0, duration: 0.6 })
          .set(sel, { display: 'none' });
      };

      const scrollDown = (ref: React.RefObject<HTMLDivElement>, scrollDur: number) => {
        if (!ref.current) return;
        const scrollObj = { y: 0 };
        // Wait 0.5s before scrolling
        tl.to({}, { duration: 0.5 });
        tl.to(scrollObj, {
          y: () => (ref.current ? ref.current.scrollHeight - ref.current.clientHeight : 0),
          duration: scrollDur,
          ease: 'power1.inOut',
          onUpdate: () => {
            if (ref.current) ref.current.scrollTop = scrollObj.y;
          }
        });
        tl.to({}, { duration: 1.5 }); // Hold at bottom
      };

      const morph = (sel: string, label: string) => {
        tl.addLabel(label);
        tl.call(() => playWhoosh(), undefined, label);

        // Elements to fade out and in
        const texts = `${sel} .ag-title, ${sel} .ag-subtitle, ${sel} .ag-btn, ${sel} .btn, ${sel} .btn-primary, ${sel} .brand, ${sel} .page-title, ${sel} .auth-logo, ${sel} .auth-subtitle`;

        tl.to(texts, { opacity: 0, duration: 0.75, ease: 'power2.in' }, label);
        tl.to(texts, { opacity: 1, duration: 0.75, ease: 'power2.out' }, `${label}+=0.75`);

        const proxy = { p: 0, lastP: 0 };
        tl.to(proxy, {
          p: 1,
          duration: 1.5,
          onUpdate: () => {
            const el = document.querySelector(sel);
            if (!el) return;

            const isForward = proxy.p >= proxy.lastP;
            proxy.lastP = proxy.p;

            if (proxy.p > 0 && proxy.p < 1) {
              el.classList.add('morphing');
            } else {
              el.classList.remove('morphing');
            }

            if (proxy.p === 0) {
              el.classList.add('beta-mode');
            } else if (proxy.p === 1) {
              el.classList.remove('beta-mode');
            } else {
              if (isForward) el.classList.remove('beta-mode');
              else el.classList.add('beta-mode');
            }

            const badge = document.querySelector('.sc-badge');
            if (badge) {
              if (proxy.p < 0.5) badge.classList.remove('is-after');
              else badge.classList.add('is-after');
            }

            const subEl = el.querySelector('.scene-sublabel');
            if (subEl) {
              if (proxy.p < 0.5) subEl.textContent = 'BETA VERSION';
              else subEl.textContent = 'PREMIUM VERSION';
            }
          }
        }, label);
      };

      const buildScene = (
        id: string,
        ref: React.RefObject<HTMLDivElement>,
        prevId: string | null,
        scrollDur: number = 0
      ) => {
        const sel = `.scene-${id}`;
        const prevSel = prevId ? `.scene-${prevId}` : undefined;
        const morphLabel = `morph-${id}`;

        showScene(sel, prevSel);

        // Hold beta for 2.5s
        tl.to({}, { duration: 2.5 });

        morph(sel, morphLabel);

        if (scrollDur > 0) {
          scrollDown(ref, scrollDur);
        } else {
          tl.to({}, { duration: 2.5 }); // Hold premium for short pages
        }
      };

      // ═══════════════════════════════════════════════════
      // ═══ INTRO ═════════════════════════════════════════
      // ═══════════════════════════════════════════════════
      tl.from('.showcase-intro', { opacity: 0, scale: 0.95, duration: 1.2, ease: 'power3.out' })
        .to({}, { duration: 1.5 })
        .to('.showcase-intro', { opacity: 0, duration: 0.8 })
        .set('.showcase-intro', { display: 'none' });

      // Show stage
      tl.to('.showcase-stage', { opacity: 1, duration: 0.2 });

      // ═══ TIMELINE SEQUENCE ═══
      buildScene('landing', sLandingRef, null, 3);
      buildScene('login', sLoginRef, 'landing', 0);
      buildScene('home', sHomeRef, 'login', 2.5);
      buildScene('shop', sShopRef, 'home', 3);
      buildScene('booking', sBookingRef, 'shop', 0);
      buildScene('search', sSearchRef, 'booking', 5);

      // Hide the final scene (search)
      tl.to('.scene-search', { opacity: 0, duration: 0.8 });
      tl.set('.scene-search', { display: 'none' });

      // ═══════════════════════════════════════════════════
      // ═══ OUTRO ═════════════════════════════════════════
      // ═══════════════════════════════════════════════════
      tl.to('.showcase-stage', { opacity: 0, duration: 0.5 });
      tl.to('.sc-badge', { opacity: 0, duration: 0.5 }, '<');
      tl.fromTo('.showcase-outro',
        { opacity: 0, scale: 0.95, pointerEvents: 'none' },
        { opacity: 1, scale: 1, pointerEvents: 'auto', duration: 1, ease: 'power3.out' }
      );
      tl.to({}, { duration: 2.5 });

      tlRef.current = tl;

      setTimeout(() => setDuration(tl.duration()), 100);
    }, wrapper);

    return () => ctx.revert();
  }, []);

  // ─── Controls ─────────────────────────────────────────
  const togglePlay = () => {
    playClick();
    if (!tlRef.current) return;
    if (playing) {
      tlRef.current.pause();
    } else {
      if (tlRef.current.progress() >= 1) tlRef.current.restart();
      else tlRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    playClick();
    if (!tlRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    tlRef.current.progress(pct);
    setProgress(pct);
    if (!playing) {
      setPlaying(true);
      tlRef.current.play();
    }
  };

  const toggleMute = () => {
    playClick();
    setMuted(!muted);
  };

  return (
    <div className="showcase-wrapper" ref={wrapperRef}>
      {/* ═══ AUDIO SOURCES ═══ */}
      <audio ref={bgmRef} loop src="https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3" />
      <audio ref={clickSfxRef} src="https://actions.google.com/sounds/v1/ui/button_click.ogg" />
      <audio ref={whooshSfxRef} src="https://actions.google.com/sounds/v1/foley/whoosh_light.ogg" />

      {/* ═══ INTRO ═══ */}
      <div className="showcase-intro">
        <ParticlesBackground />
        <h1>B_Hair</h1>
        <p>Design Evolution</p>
      </div>

      {/* ═══ OUTRO ═══ */}
      <div className="showcase-outro" style={{ opacity: 0, pointerEvents: 'none' }}>
        <ParticlesBackground />
        <h1>B_Hair</h1>
        <p>Antigravity Experience</p>
        <button
          className="ag-btn sc-login-btn"
          onClick={() => navigate('/login')}
        >
          Đăng Nhập
        </button>
      </div>

      {/* ═══ STAGE ═══ */}
      <div className="showcase-stage">
        {/* ═══ SCENE 1: LANDING ═══ */}
        <div className="showcase-scene scene-landing beta-mode" ref={sLandingRef}>
          <div className="scene-label-wrap">
            <h2 className="scene-label">Landing Page</h2>
            <div className="scene-sublabel">BETA VERSION</div>
          </div>
          <div className="landing-wrapper" style={{ minHeight: 'auto' }}>
            <ParticlesBackground />

            <section className="landing-section hero-section" style={{ minHeight: '100vh', padding: '120px 20px' }}>
              <h1 className="ag-title">B Hair</h1>
              <p className="ag-subtitle" style={{ fontSize: '1.4rem', maxWidth: 600, textAlign: 'center', margin: '0 auto 50px' }}>
                B_Hair tái định nghĩa trải nghiệm cắt tóc. Mượt mà, trực quan và sang trọng. Đặt lịch ngay hôm nay với công nghệ AI thấu hiểu phong cách của bạn.
              </p>
              <button className="ag-btn" style={{ margin: '0 auto', display: 'block' }}>Đăng Nhập</button>
            </section>

            <section className="landing-section features-section" style={{ minHeight: '100vh', padding: '120px 20px' }}>
              <h2 className="ag-title" style={{ fontSize: '4vw' }}>Kiến Tạo Trải Nghiệm</h2>
              <div className="ag-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1200, margin: '60px auto 0' }}>
                <div className="ag-card">
                  <h3>Công Nghệ Vượt Trội</h3>
                  <p>Loại bỏ hoàn toàn sự chờ đợi. Hệ thống đồng bộ real-time giúp bạn kiểm soát quỹ thời gian cá nhân một cách tuyệt đối.</p>
                </div>
                <div className="ag-card">
                  <h3>Trí Tuệ Nhân Tạo</h3>
                  <p>AI độc quyền phân tích tỷ lệ vàng trên khuôn mặt, đề xuất những đường cắt và tông màu hoàn mỹ nhất dành riêng cho bạn.</p>
                </div>
                <div className="ag-card">
                  <h3>Hệ Sinh Thái 5 Sao</h3>
                  <p>Mạng lưới các tiệm tóc cao cấp được tuyển chọn khắt khe, đi kèm hệ thống đánh giá minh bạch từ cộng đồng tinh hoa.</p>
                </div>
              </div>
            </section>

            <section className="landing-section reviews-section" style={{ minHeight: '100vh', padding: '120px 20px' }}>
              <h2 className="ag-title" style={{ fontSize: '4vw' }}>Khách Hàng Nói Gì</h2>
              <div className="ag-reviews-grid" style={{ display: 'flex', gap: 30, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
                <div className="ag-review-card">
                  <div className="stars">★★★★★</div>
                  <p>"Dịch vụ tuyệt vời! Không gian sang trọng và thợ cắt cực kỳ chuyên nghiệp. Chắc chắn sẽ quay lại."</p>
                  <h4>- Minh Vũ</h4>
                </div>
                <div className="ag-review-card">
                  <div className="stars">★★★★★</div>
                  <p>"Hệ thống đặt lịch thông minh, tôi không bao giờ phải chờ đợi. Đẳng cấp hoàn toàn khác biệt."</p>
                  <h4>- Hoàng Tuấn</h4>
                </div>
                <div className="ag-review-card">
                  <div className="stars">★★★★★</div>
                  <p>"Tông màu nhuộm lên cực chuẩn. Rất đáng tiền cho một không gian dịch vụ 5 sao như thế này."</p>
                  <h4>- Kiên Nguyễn</h4>
                </div>
              </div>
            </section>

            <section className="landing-section" style={{ minHeight: '60vh', padding: '120px 20px' }}>
              <h2 className="ag-title" style={{ fontSize: '5vw' }}>Sẵn Sàng Thay Đổi?</h2>
              <div style={{ marginTop: 30, textAlign: 'center' }}>
                <button className="ag-btn">Gia Nhập B_Hair Ngay</button>
              </div>
            </section>
          </div>
        </div>

        {/* ═══ SCENE 2: LOGIN ═══ */}
        <div className="showcase-scene scene-login beta-mode" ref={sLoginRef}>
          <div className="scene-label-wrap">
            <h2 className="scene-label">Login Page</h2>
            <div className="scene-sublabel">BETA VERSION</div>
          </div>
          <div className="auth-page-premium">
            <ParticlesBackground />
            <div className="auth-card" style={{ maxWidth: 400, margin: '0 auto', padding: 40 }}>
              <div style={{ marginBottom: 32 }}>
                <div className="auth-logo" style={{ fontSize: 32, fontWeight: 800 }}>B_Hair</div>
                <p className="auth-subtitle">Chào mừng trở lại</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: 13, fontWeight: 600 }}>Số điện thoại</label>
                  <input className="auth-input-premium" placeholder="Nhập số điện thoại" style={{ width: '100%', padding: '12px 16px' }} />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: 13, fontWeight: 600 }}>Mật khẩu</label>
                  <input className="auth-input-premium" type="password" placeholder="••••••••" style={{ width: '100%', padding: '12px 16px' }} />
                </div>
                <button
                  className="btn btn-full btn-lg"
                  style={{ marginTop: 8, background: 'var(--color-primary, #c49b66)', color: '#000', border: 'none', fontWeight: 800 }}
                >
                  Đăng Nhập
                </button>
              </div>
              <div className="divider-text" style={{ margin: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Tiếp tục với</div>
              <button
                className="btn"
                style={{ width: '100%', padding: 12, background: 'transparent', color: 'var(--text, #fff)', border: '1px solid var(--border, rgba(255,255,255,0.2))', borderRadius: 8, fontWeight: 600 }}
              >
                Google
              </button>
            </div>
          </div>
        </div>

        {/* ═══ SCENE 3: HOME ═══ */}
        <div className="showcase-scene scene-home beta-mode" ref={sHomeRef}>
          <div className="scene-label-wrap">
            <h2 className="scene-label">Home Page</h2>
            <div className="scene-sublabel">BETA VERSION</div>
          </div>
          <ParticlesBackground />
          <div className="showcase-scene-inner">
            <div className="page" style={{ minHeight: 'auto', paddingBottom: 100 }}>
              <div className="page-header" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
                <div className="brand" style={{ fontWeight: 800 }}>B_Hair</div>
                <div className="brand-divider" style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 12px' }} />
                <div className="page-title" style={{ fontWeight: 600 }}>Trang chủ</div>
              </div>
              <div className="section" style={{ padding: '16px 24px' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Xin chào, Minh Vũ</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>Tìm kiểu tóc hoàn hảo</div>
                </div>
                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', marginBottom: 24 }}>
                  <span>🔍</span> <span style={{ color: 'var(--outline)' }}>Tìm kiếm tiệm, dịch vụ...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Tiệm nổi bật</h2>
                  <span style={{ color: 'var(--color-secondary)', fontSize: 13, fontWeight: 600 }}>Xem tất cả</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { name: 'The Gentleman Club', addr: '456 Lê Lợi, Quận 3', img: '1599351431202-1e0f0137899a', rating: '4.9' },
                    { name: 'House of Barbaard', addr: '12/4B Nguyễn Đình Chiểu, Q.1', img: '1585747860715-2ba37e788b70', rating: '4.8' },
                    { name: 'Liem Barber Shop', addr: '79 Nguyễn Trãi, Quận 5', img: '1622286342621-4bd786c2447c', rating: '4.7' },
                    { name: 'Mekong Barbershop', addr: '177 Trần Hưng Đạo, Q.1', img: '1580618672591-eb180b1a973f', rating: '4.9' }
                  ].map((salon, i) => (
                    <div key={i} className="card" style={{ overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: 160, background: `url(https://images.unsplash.com/photo-${salon.img}?auto=format&fit=crop&w=600&q=80) center/cover`, position: 'relative' }}>
                        <div className="rating-badge" style={{ position: 'absolute', top: 12, right: 12, background: '#fff', color: '#333', padding: '4px 8px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                          <span className="star">★</span> {salon.rating}
                        </div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{salon.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>📍 {salon.addr}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Mở cửa</span> · 08:00 - 20:00
                          </div>
                          <button className="btn btn-primary btn-sm" style={{ padding: '6px 16px', fontSize: 12 }}>Đặt lịch</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SCENE 4: SHOP ═══ */}
        <div className="showcase-scene scene-shop beta-mode" ref={sShopRef}>
          <div className="scene-label-wrap">
            <h2 className="scene-label">Shop Detail</h2>
            <div className="scene-sublabel">BETA VERSION</div>
          </div>
          <ParticlesBackground />
          <div className="showcase-scene-inner">
            <div className="page" style={{ paddingBottom: 100 }}>
              <div style={{ width: '100%', height: 360, background: 'url(https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80) center/cover' }} />
              <div style={{ padding: '24px 20px 0' }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>The Gentleman Club</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: 'var(--color-primary)' }}>★</span> <span style={{ fontWeight: 600 }}>4.9</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>(256 đánh giá)</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍 456 Lê Lợi, Quận 3, TP.HCM</div>
              </div>

              <div className="section" style={{ paddingTop: 20, paddingBottom: 24, padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                  <button className="btn glass-card" style={{ flex: 1, padding: '12px 16px', color: 'inherit' }}>📞 Gọi điện</button>
                  <button className="btn glass-card" style={{ flex: 1, padding: '12px 16px', color: 'inherit' }}>🗺 Chỉ đường</button>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--color-primary)' }}>Dịch vụ</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { name: 'Cắt tóc nam', price: 80, time: 30, img: '1622286342621-4bd786c2447c' },
                    { name: 'Gội đầu massage', price: 50, time: 30, img: '1516975080664-ed2fc6a32937' },
                    { name: 'Nhuộm tóc', price: 200, time: 60, img: '1599351431202-1e0f0137899a' },
                    { name: 'Uốn tóc Hàn Quốc', price: 250, time: 60, img: '1585747860715-2ba37e788b70' },
                    { name: 'Cạo râu khăn nóng', price: 100, time: 20, img: '1580618672591-eb180b1a973f' }
                  ].map((svc, i) => (
                    <div key={i} className="glass-card service-item" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 12, background: `url(https://images.unsplash.com/photo-${svc.img}?auto=format&fit=crop&w=200&q=80) center/cover` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{svc.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{svc.time} phút</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{svc.price},000đ</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: 600, padding: '16px 24px 24px 24px', background: 'rgba(15, 15, 15, 0.85)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)', zIndex: 100 }}>
                <button className="btn btn-primary btn-full btn-lg" style={{ padding: 16 }}>Đặt Lịch Ngay</button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SCENE 5: BOOKING ═══ */}
        <div className="showcase-scene scene-booking beta-mode" ref={sBookingRef}>
          <div className="scene-label-wrap">
            <h2 className="scene-label">Booking Page</h2>
            <div className="scene-sublabel">BETA VERSION</div>
          </div>
          <ParticlesBackground />
          <div className="showcase-scene-inner">
            <div className="page" style={{ paddingBottom: 100 }}>
              <div className="page-header" style={{ padding: '20px 24px', display: 'flex' }}>
                <span style={{ color: 'var(--text-muted)' }}>← Quay lại</span>
                <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 16 }}>Đặt lịch</span>
              </div>

              <div className="wizard-steps" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>1</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Dịch vụ</span>
                </div>
                <div style={{ width: 40, height: 2, background: 'var(--border)', margin: '0 12px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>2</div>
                  <span style={{ fontSize: 13 }}>Thời gian</span>
                </div>
              </div>

              <div className="section" style={{ padding: '0 24px' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Chọn dịch vụ</h2>
                <div className="card" style={{ padding: '0 16px', marginBottom: 24 }}>
                  {[
                    { name: 'Cắt tóc nam', checked: true, price: '80,000đ' },
                    { name: 'Gội đầu massage', checked: true, price: '50,000đ' },
                    { name: 'Nhuộm tóc', checked: false, price: '200,000đ' },
                    { name: 'Uốn tóc', checked: false, price: '250,000đ' }
                  ].map((svc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: svc.checked ? 'none' : '2px solid var(--outline)', background: svc.checked ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {svc.checked && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{svc.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>30 phút</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{svc.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: 600, padding: '16px 24px 24px 24px', background: 'var(--surface, rgba(15, 15, 15, 0.85))', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border)', zIndex: 100 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>2 dịch vụ (60p)</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>130,000đ</span>
                </div>
                <button className="btn btn-primary btn-full btn-lg">Tiếp tục</button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SCENE 6: SEARCH ═══ */}
        <div className="showcase-scene scene-search beta-mode" ref={sSearchRef}>
          <div className="scene-label-wrap">
            <h2 className="scene-label">Search Page</h2>
            <div className="scene-sublabel">BETA VERSION</div>
          </div>
          <ParticlesBackground />
          <div className="showcase-scene-inner">
            <div className="page">
              <div className="page-header" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
                <span className="brand" style={{ fontWeight: 800 }}>B_Hair</span>
                <div className="brand-divider" style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 12px' }} />
                <span className="page-title" style={{ fontWeight: 600 }}>Tìm kiếm</span>
              </div>

              <div className="section" style={{ padding: '0 24px' }}>
                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', marginBottom: 12 }}>
                  <span>🔍</span> <input placeholder="Tìm kiếm tiệm, dịch vụ..." style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
                  {['✂️ Cắt tóc', '💈 Uốn', '🎨 Nhuộm', '📍 Gần tôi'].map((chip, i) => (
                    <button key={i} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid var(--outline)', background: i === 0 ? 'var(--color-primary)' : 'var(--surface)', color: i === 0 ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {chip}
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 12 }}>12 kết quả</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 }}>
                  {[
                    { name: 'Hair Studio 99', addr: '789 Trần Hưng Đạo, Quận 5', img: '1580618672591-eb180b1a973f' },
                    { name: 'Classic Barber', addr: '12 Nguyễn Trãi, Quận 1', img: '1599351431202-1e0f0137899a' },
                    { name: 'Tony Barber Shop', addr: '45 Lê Văn Sỹ, Phú Nhuận', img: '1585747860715-2ba37e788b70' },
                    { name: '4RAU Barber', addr: '112 Điện Biên Phủ, Quận 3', img: '1622286342621-4bd786c2447c' },
                    { name: 'Vũ Trí Barber', addr: '344 Lê Hồng Phong, Quận 10', img: '1516975080664-ed2fc6a32937' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 90, height: 68, borderRadius: 8, background: `url(https://images.unsplash.com/photo-${item.img}?auto=format&fit=crop&w=200&q=80) center/cover` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>📍 {item.addr}</div>
                        <div style={{ fontSize: 12 }}>🕐 08:30 - 19:30</div>
                      </div>
                      <div style={{ color: 'var(--outline)', fontSize: 18, alignSelf: 'center' }}>›</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Before/After Badge (Restored) */}
      <div className="sc-badge" style={{ position: 'fixed', bottom: 32, left: 24, zIndex: 9999 }}></div>

      {/* ═══ CONTROLS (HIDDEN) ═══ 
      <div className="showcase-controls">
        <button className="sc-play-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="currentColor" /><rect x="14" y="4" width="4" height="16" fill="currentColor" /></svg>
          ) : (
            <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="currentColor" /></svg>
          )}
        </button>

        <div className="sc-badge"></div>

        <div className="sc-progress" ref={progressRef} onClick={handleSeek}>
          <div className="sc-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        <span className="sc-time">
          {fmt(progress * duration)} / {fmt(duration)}
        </span>

        <button className="sc-mute-btn" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      </div>
      */}

      {/* Floating Audio Toggle */}
      <button 
        onClick={toggleMute} 
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(15, 15, 15, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}

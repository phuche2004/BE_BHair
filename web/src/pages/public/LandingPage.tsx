import React, { useLayoutEffect, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './LandingPage.css';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Redirect if logged in
  useEffect(() => {
    if (token) {
      if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
        navigate('/manager/appointments', { replace: true });
      } else if (user?.role === 'STAFF') {
        navigate('/staff/appointments', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [token, user, navigate]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core Engine: Smooth Scroll (Lenis), Magnetic Snap (GSAP) & Particle Physics
  useEffect(() => {
    if (token || !canvasRef.current) return;

    // --- 1. LENIS SMOOTH SCROLL ---
    const lenis = new Lenis({
      lerp: 0.05, // Tạo quán tính dài siêu mượt (Momentum)
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // --- 2. GSAP SCROLL UPDATE ---
    // (Xóa bỏ GSAP Snap cũ vì nó xung đột với page không đều nhau)
    lenis.on('scroll', ScrollTrigger.update);

    // --- 3. PARTICLE PHYSICS ---
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const mouse = { x: -1000, y: -1000 };
    let scrollVelocity = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    // Đã xóa nam châm vì xung đột phần cứng.
    // Lấy vận tốc mượt từ Lenis cho Particle Wind
    lenis.on('scroll', (e: any) => {
      scrollVelocity = e.velocity * 1.5;
    });

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      x: number; y: number; size: number; vx: number; vy: number; baseAlpha: number;
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.pow(Math.random(), 3) * 4 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.baseAlpha = Math.random() * 0.5 + 0.1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let alpha = this.baseAlpha;
        if (distance < 180) {
          const force = (180 - distance) / 180;
          this.x -= (dx / distance) * force * 1.5;
          this.y -= (dy / distance) * force * 1.5;
          alpha = Math.min(1, this.baseAlpha + force);
        }

        ctx!.fillStyle = `rgba(196, 155, 102, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      // Tăng mật độ hạt lên gấp 1.5 lần (giảm mẫu số từ 8000 xuống 5300) và giới hạn 400
      const numParticles = Math.min(Math.floor((canvas.width * canvas.height) / 5300), 400);
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      scrollVelocity *= 0.92; // Ma sát

      particles.forEach(p => {
        if (Math.abs(scrollVelocity) > 0.1) {
          p.y -= scrollVelocity * (p.size * 0.08); // Parallax wind
        }
        p.update();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, [token]);

  // GSAP Scroll Animations
  useLayoutEffect(() => {
    if (token) return;
    const ctx = gsap.context(() => {

      // Hero Section: Chữ mờ dần khi cuộn xuống
      gsap.to('.hero-anim', {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1, // Làm mượt nhẹ khi cuộn
        }
      });

      // Universal Pop-up Fade In (Theo nhóm từng Section để có Stagger tuần tự)
      const sections = gsap.utils.toArray('.landing-section');
      sections.forEach((sec: any) => {
        const fadeElements = sec.querySelectorAll('.ag-fade-up');
        if (fadeElements.length > 0) {
          gsap.from(fadeElements, {
            y: 60,
            scale: 0.85,
            opacity: 0,
            duration: 1.2,
            stagger: 0.15, // Chạy tuần tự từng phần tử cách nhau 0.15s
            ease: 'back.out(1.5)', // Pop up nảy mạnh
            scrollTrigger: {
              trigger: sec,
              start: 'top 85%', // Kích hoạt khi đỉnh Section vào tầm ngắm
              toggleActions: 'play none none reverse',
            }
          });
        }
      });

    }, wrapperRef);

    // Cleanup
    return () => {
      ctx.revert();
    };
  }, [token]);

  if (token) return null;

  return (
    <div className="landing-wrapper" ref={wrapperRef}>
      {/* Hệ thống hạt Particle tương tác */}
      <canvas id="particle-canvas" ref={canvasRef}></canvas>

      {/* --- Hero Section --- */}
      <section className="landing-section hero-section">
        <h1 className="ag-title hero-anim">
          B Hair
        </h1>
        <p className="ag-subtitle hero-anim">
          B_Hair tái định nghĩa trải nghiệm cắt tóc. Mượt mà, trực quan và sang trọng. Đặt lịch ngay hôm nay với công nghệ AI thấu hiểu phong cách của bạn.
        </p>
        <button className="ag-btn hero-anim" onClick={() => navigate('/login')}>
          Bắt Đầu Khám Phá
        </button>

        {/* --- Scroll Hint --- */}
        <div className="ag-scroll-hint hero-anim">
          <div className="mouse"></div>
          <span>Cuộn Xuống</span>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section className="landing-section features-section">
        <h2 className="ag-title ag-fade-up" style={{ fontSize: '4vw' }}>Kiến Tạo Trải Nghiệm</h2>
        <div className="ag-features">
          <div className="ag-card ag-fade-up">
            <h3>Công Nghệ Vượt Trội</h3>
            <p>Loại bỏ hoàn toàn sự chờ đợi. Hệ thống đồng bộ real-time giúp bạn kiểm soát quỹ thời gian cá nhân một cách tuyệt đối.</p>
          </div>
          <div className="ag-card ag-fade-up">
            <h3>Trí Tuệ Nhân Tạo</h3>
            <p>AI độc quyền phân tích tỷ lệ vàng trên khuôn mặt, đề xuất những đường cắt và tông màu hoàn mỹ nhất dành riêng cho bạn.</p>
          </div>
          <div className="ag-card ag-fade-up">
            <h3>Hệ Sinh Thái 5 Sao</h3>
            <p>Mạng lưới các tiệm tóc cao cấp được tuyển chọn khắt khe, đi kèm hệ thống đánh giá minh bạch từ cộng đồng tinh hoa.</p>
          </div>
        </div>
      </section>

      {/* --- Reviews Section --- */}
      <section className="landing-section reviews-section">
        <h2 className="ag-title ag-fade-up" style={{ fontSize: '4vw' }}>Khách Hàng Nói Gì</h2>
        <div className="ag-reviews-grid">
          <div className="ag-review-card ag-fade-up">
            <div className="stars">★★★★★</div>
            <p>"Dịch vụ tuyệt vời! Không gian sang trọng và thợ cắt cực kỳ chuyên nghiệp. Chắc chắn sẽ quay lại."</p>
            <h4>- Minh Vũ</h4>
          </div>
          <div className="ag-review-card ag-fade-up" style={{ transitionDelay: '0.1s' }}>
            <div className="stars">★★★★★</div>
            <p>"Hệ thống đặt lịch thông minh, tôi không bao giờ phải chờ đợi. Đẳng cấp hoàn toàn khác biệt."</p>
            <h4>- Hoàng Tuấn</h4>
          </div>
          <div className="ag-review-card ag-fade-up" style={{ transitionDelay: '0.2s' }}>
            <div className="stars">★★★★★</div>
            <p>"Tông màu nhuộm lên cực chuẩn. Rất đáng tiền cho một không gian dịch vụ 5 sao như thế này."</p>
            <h4>- Kiên Nguyễn</h4>
          </div>
        </div>
      </section>

      {/* --- Gallery Section --- */}
      <section className="landing-section gallery-section">
        <h2 className="ag-title ag-fade-up" style={{ fontSize: '4vw', marginBottom: '80px' }}>Không Gian Độc Bản</h2>
        <div className="ag-gallery">
          <div className="ag-gallery-row">
            <div className="ag-img-box ag-fade-up">
              <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80" alt="Space 1" />
            </div>
            <div className="ag-img-box ag-fade-up" style={{ flex: 1.5 }}>
              <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80" alt="Space 2" />
            </div>
          </div>
          <div className="ag-gallery-row">
            <div className="ag-img-box ag-fade-up" style={{ flex: 1.5 }}>
              <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80" alt="Space 3" />
            </div>
            <div className="ag-img-box ag-fade-up">
              <img src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80" alt="Space 4" />
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer Section --- */}
      <section className="landing-section" style={{ minHeight: '60vh' }}>
        <h2 className="ag-title ag-fade-up" style={{ fontSize: '5vw' }}>Sẵn Sàng Thay Đổi?</h2>
        <div className="ag-fade-up" style={{ marginTop: '30px' }}>
          <button className="ag-btn" onClick={() => navigate('/login')}>
            Gia Nhập B_Hair Ngay
          </button>
        </div>
        <div style={{ position: 'absolute', bottom: '40px', color: 'var(--c-muted)', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} B_Hair. Antigravity Experience.
        </div>
      </section>

    </div>
  );
}

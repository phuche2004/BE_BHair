export function formatCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export function formatDate(dateStr: string, locale = 'vi-VN'): string {
  return new Date(dateStr).toLocaleDateString(locale);
}

export function formatTime(dateStr: string, locale = 'vi-VN'): string {
  return new Date(dateStr).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateTime(dateStr: string, locale = 'vi-VN'): string {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getNext7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return toDateStr(d);
  });
}

export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'badge-pending',
    CONFIRMED: 'badge-confirmed',
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
    NO_SHOW: 'badge-no_show',
  };
  return map[status] || 'badge-pending';
}

export const SAMPLE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1EMmzLiUnvvExlXuuJ5TwhZ-UGvA7TSC12PvpAVXRpB8gbEV_fVp89prjitZINmGKQNMQHKOPZAcyvv6wezOjMviYcaNJWi-wMhzr_GSymToXbhBakwhrdhjstGeaGBdgatqGWfH7c7FA2NCn43vBmhZiqu1MRJ7ivMy4UUPGJ5lk92m5rdc7nehZtKh02Qm5Twl6ybLaUODV3qsHUDzoyVedRi7977qNN2cTeuyIMJTyd4jMzX6ttIg4FVGkV1i6TIoG9n4kGWJe',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBERzxIwDuffh6GyR8--YHgOLSePw5Zl6ksUmUtjZlGKBBBvDuhQOoITy1V4x_6kQICRGuhwZSn6uRD5yISOiyoDuIdBN4DH_NS263sXddUPTtoxyJX7ZzqmfdAZbMVucuTLM19n_j-takCbpck65Km8ccD3ZOE6x13-g7VAB-F_omBRygVhk9uabcwBp9vVkuBACcK6kbmjwLEJaUtm3wU3D6MT63MDjF2g4awpw59imfS8bdlpMvDIP1mHyfbVyqherNCKy_Evrea',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBPSHcmKTyocBKUuJqCc2wBqyLE6PTk4qyGTfup5ulljstQZJu2H0V3xMtYYzvfespOpPP5PsVvPHv_4e17SXv5jmawxZgmuFl77xtYU6z4LGa_B98NYU47RHZztSMbA7DcfUN9DKFLMjHn0U75csIgIHe9j3dWHl_eiAToV2E_SzHPgLO0SBSVEx3rWv8Ss6bbWQ2_ezRTXTKwGWYCyhD8CQd2P4Y8DU--9rZM3gShG2LOOp08akXEBhSJBLRwJCSB661PIR-xYAxg',
];

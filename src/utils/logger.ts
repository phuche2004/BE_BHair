// Logger utility: thêm timestamp, chỉ log startup 1 lần khi chạy PM2 cluster
const isLeader = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
const isWorker = process.env.NODE_APP_INSTANCE !== undefined;

function timestamp() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Saigon',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format();
}

// Chỉ log startup (số thứ tự worker) khi không phải leader
const workerTag = isWorker ? ` [W${process.env.NODE_APP_INSTANCE}]` : '';

/**
 * Log startup message - chỉ in từ worker leader (tránh trùng lặp)
 */
export function startupLog(...args: any[]) {
  if (!isLeader) return;
  console.log(`[${timestamp()}]${workerTag}`, ...args);
}

/**
 * Log thông thường kèm timestamp (in từ tất cả workers, không lọc)
 */
export function log(...args: any[]) {
  console.log(`[${timestamp()}]${workerTag}`, ...args);
}

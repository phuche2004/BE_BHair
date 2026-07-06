// SQLite-only database connection for fullstack/production branches
// MongoDB support is only in main branch (for Render.com)
import db from './sqlite.config';

import { startupLog } from '../utils/logger';

const connectDatabase = async () => {
    // SQLite is already connected synchronously via sqlite.config.ts
    startupLog('✅ Using SQLite database');
};

export default connectDatabase;

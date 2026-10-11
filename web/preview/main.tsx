// Standalone preview entry — renders the exact same app outside Next.js
// so it can be shared as a single self-contained HTML file.
import { createRoot } from 'react-dom/client';
import MizanApp from '@/components/MizanApp';

createRoot(document.getElementById('root')!).render(<MizanApp />);

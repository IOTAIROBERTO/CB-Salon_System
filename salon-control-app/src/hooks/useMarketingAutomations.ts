import { useEffect } from 'react';
import { emailMarketingService } from '../services/emailMarketingService';

/**
 * Hook to handle background marketing automation checks.
 * Periodic interval to trigger birthday, reactivation, and post-visit campaigns.
 */
export const useMarketingAutomations = () => {
    useEffect(() => {
        // Initial check on load
        const initialCheck = setTimeout(() => {
            emailMarketingService.checkAutomations();
        }, 5000); // Wait 5s after load to not block UI

        // Periodic check every 12 hours (or daily)
        // For many local apps, checking on load is sufficient, but let's add a 
        // safety interval if the app stays open for long periods.
        const interval = setInterval(() => {
            emailMarketingService.checkAutomations();
        }, 12 * 60 * 60 * 1000); // 12 hours

        return () => {
            clearTimeout(initialCheck);
            clearInterval(interval);
        };
    }, []);
};

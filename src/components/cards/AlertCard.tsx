import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import DashboardCard, { DashboardCardProps } from './DashboardCard';

type AlertType = 'info' | 'warning' | 'error' | 'success';

interface AlertCardProps extends Omit<DashboardCardProps, 'children'> {
  type: AlertType;
  message: string;
  details?: string;
  timestamp?: string;
  actionable?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  autoDisappear?: boolean;
  autoDisappearTime?: number; // in milliseconds
}

/**
 * Alert Card Component for SCB Sapphire FinSight dashboard
 * Displays important notifications and alerts with appropriate styling
 * Following SCB brand guidelines and SAP Fiori design principles
 */
const AlertCard: React.FC<AlertCardProps> = ({
  type,
  message,
  details,
  timestamp,
  actionable = false,
  actionLabel = 'View',
  onAction,
  dismissible = true,
  onDismiss,
  autoDisappear = false,
  autoDisappearTime = 5000,
  ...cardProps
}) => {
  const [visible, setVisible] = React.useState(true);
  
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (autoDisappear) {
      timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, autoDisappearTime);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoDisappear, autoDisappearTime, onDismiss]);
  
  if (!visible) return null;
  
  const getTypeStyles = () => {
    switch (type) {
      case 'info':
        return {
          icon: <Info size={20} />,
          bgColor: 'bg-[rgba(var(--scb-honolulu-blue),0.1)]',
          borderColor: 'border-[rgb(var(--scb-honolulu-blue))]',
          textColor: 'text-[rgb(var(--scb-honolulu-blue))]'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} />,
          bgColor: 'bg-[rgba(var(--horizon-red),0.1)]',
          borderColor: 'border-[rgb(var(--horizon-red))]',
          textColor: 'text-[rgb(var(--horizon-red))]'
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} />,
          bgColor: 'bg-[rgba(var(--scb-muted-red),0.1)]',
          borderColor: 'border-[rgb(var(--scb-muted-red))]',
          textColor: 'text-[rgb(var(--scb-muted-red))]'
        };
      case 'success':
        return {
          icon: <CheckCircle size={20} />,
          bgColor: 'bg-[rgba(var(--scb-american-green),0.1)]',
          borderColor: 'border-[rgb(var(--scb-american-green))]',
          textColor: 'text-[rgb(var(--scb-american-green))]'
        };
    }
  };
  
  const styles = getTypeStyles();
  
  return (
    <DashboardCard 
      className={`${styles.bgColor} border-l-4 ${styles.borderColor}`}
      {...cardProps}
    >
      <div className="flex">
        <div className={`mr-3 flex-shrink-0 ${styles.textColor}`}>
          {styles.icon}
        </div>
        
        <div className="flex-grow">
          <div className={`scb-data-label-large font-medium ${styles.textColor}`}>
            {message}
          </div>
          
          {details && (
            <div className="scb-data-label mt-1">
              {details}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3">
            {timestamp && (
              <div className="scb-supplementary">
                {timestamp}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {actionable && (
                <button 
                  className={`px-3 py-1 rounded text-sm font-medium ${styles.textColor} border ${styles.borderColor} hover:bg-white transition-colors`}
                  onClick={onAction}
                >
                  {actionLabel}
                </button>
              )}
              
              {dismissible && (
                <button 
                  className="p-1 rounded hover:bg-white"
                  onClick={() => {
                    setVisible(false);
                    if (onDismiss) onDismiss();
                  }}
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};

export default AlertCard;

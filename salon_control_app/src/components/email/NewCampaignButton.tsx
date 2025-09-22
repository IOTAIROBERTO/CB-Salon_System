// src/components/email/NewCampaignButton.tsx
import React from 'react';
import { Plus } from 'lucide-react';

interface NewCampaignButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const NewCampaignButton: React.FC<NewCampaignButtonProps> = ({
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        bg-purple-600 text-white font-medium rounded-lg 
        hover:bg-purple-700 focus:outline-none focus:ring-2 
        focus:ring-purple-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      <Plus size={20} />
      <span>Nueva Campaña</span>
    </button>
  );
};

export default NewCampaignButton;
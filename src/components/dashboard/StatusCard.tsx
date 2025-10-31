// src/components/dashboard/StatusCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface StatusCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactElement; // Accept React element (like <UserCheckIcon />)
  linkTo?: string;
  // MODIFIED: Added status prop for conditional styling
  status?: 'active' | 'inactive' | 'dnd' | 'warning';
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  description,
  icon,
  linkTo,
  status = 'active' // Default to 'active'
}) => {

  // MODIFIED: Logic to determine colors based on status
  let bgColor = 'bg-primary-100'; // Default
  let textColor = 'text-primary';
  let valueColor = 'text-gray-900';
  let descColor = 'text-gray-600';

  switch (status) {
    case 'active':
      bgColor = 'bg-success-100';
      textColor = 'text-success-700';
      valueColor = 'text-success-800';
      descColor = 'text-success-700';
      break;
    case 'inactive':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-600';
      valueColor = 'text-gray-900';
      descColor = 'text-gray-700';
      break;
    case 'dnd':
      bgColor = 'bg-destructive-100';
      textColor = 'text-destructive-700';
      valueColor = 'text-destructive-800';
      descColor = 'text-destructive-700';
      break;
    case 'warning':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      valueColor = 'text-yellow-800';
      descColor = 'text-yellow-700';
      break;
    default:
      // Use default colors
      break;
  }
  
  // Truncate long descriptions (like announcements)
  const displayDescription = description.length > 50 
    ? `${description.substring(0, 50)}...` 
    : description;

  const cardContent = (
    <div className={`p-4 rounded-lg shadow-sm border ${bgColor} ${textColor}`}>
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium uppercase tracking-wide">{title}</h3>
        {React.cloneElement(icon, { className: `w-5 h-5 ${textColor}` })}
      </div>
      <div className="mt-2">
        <div className={`text-2xl font-semibold ${valueColor}`}>{value}</div>
        <p className={`text-xs ${descColor} mt-1 h-8`}> {/* Fixed height for alignment */}
          {displayDescription}
        </p>
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};
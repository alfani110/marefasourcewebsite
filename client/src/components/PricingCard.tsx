import React from 'react';
import { Button } from '@/components/ui/button';

interface PricingFeature {
  text: string;
  included?: boolean;
}

interface PricingCardProps {
  title: string;
  price: number;
  features: (string | PricingFeature)[];
  onUpgrade: () => void;
  current?: boolean;
  badge?: 'star' | 'crown';
  badgeColor?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  features,
  onUpgrade,
  current = false,
  badge,
  badgeColor = 'islamic-green'
}) => {
  return (
    <div className="pricing-card relative bg-dark-card rounded-xl p-6 border border-dark-border hover:border-islamic-green transition-all">
      {badge && (
        <div className={`tier-badge w-8 h-8 bg-${badgeColor} text-${badgeColor === 'islamic-gold' ? 'dark-bg' : 'white'}`}>
          <i className={`fas fa-${badge}`}></i>
        </div>
      )}
      
      <h3 className="text-xl font-bold mb-2 text-light-text">{title}</h3>
      <p className="text-3xl font-bold mb-4 text-light-text">
        ${price.toFixed(2)} <span className="text-sm font-normal text-light-text-secondary">/month</span>
      </p>
      
      <p className="text-light-text-secondary mb-6">
        {title === 'Free' && 'Start your journey with basic access to Islamic knowledge.'}
        {title === 'Basic' && 'Enhanced access with focus on personal guidance.'}
        {title === 'Research' && 'Complete access with deep scholarly research capabilities.'}
      </p>
      
      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => {
          const isString = typeof feature === 'string';
          const text = isString ? feature : feature.text;
          const included = isString ? true : feature.included !== false;
          
          return (
            <li className="flex items-start" key={index}>
              <i className={`fas fa-${included ? 'check text-islamic-green' : 'times text-red-500'} mt-1 mr-2`}></i>
              <span className="text-light-text-secondary">{text}</span>
            </li>
          );
        })}
      </ul>
      
      <Button
        className={`w-full py-3 rounded-lg ${
          current 
            ? 'bg-dark-border text-light-text hover:bg-dark-bg' 
            : title === 'Basic'
              ? 'bg-islamic-green text-white hover:opacity-90'
              : title === 'Research'
                ? 'bg-islamic-gold text-dark-bg hover:opacity-90'
                : 'bg-islamic-green text-white hover:bg-islamic-dark'
        } transition-colors`}
        onClick={onUpgrade}
        disabled={current}
      >
        {current ? 'Current Plan' : title === 'Free' ? 'Basic Plan' : title === 'Research' ? 'Get Research Access' : 'Upgrade Now'}
      </Button>
    </div>
  );
};

export default PricingCard;

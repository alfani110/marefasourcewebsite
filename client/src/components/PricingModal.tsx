import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PricingCard from './PricingCard';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  
  const handleUpgrade = (plan: string) => {
    if (!user) {
      onClose();
      // Show auth modal first
      return;
    }
    
    navigate('/subscription?plan=' + plan);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-surface text-light-text sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2">Upgrade Your Mārefa Source Experience</DialogTitle>
          <p className="text-light-text-secondary">
            Choose the plan that best fits your Islamic knowledge journey. Unlock deeper insights and extended conversations.
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <PricingCard
            title="Free"
            price={0}
            current={user?.subscriptionTier === 'free'}
            features={[
              '50 messages per month',
              'Basic Ahkam 101 access',
              'Limited Sukoon therapy sessions',
              { text: 'No Research Mode access', included: false }
            ]}
            onUpgrade={() => {}}
          />
          
          <PricingCard
            title="Basic"
            price={9.99}
            current={user?.subscriptionTier === 'basic'}
            badge="star"
            features={[
              'Unlimited messages',
              'Full Ahkam 101 access',
              'Extended Sukoon therapy sessions',
              { text: 'Limited Research Mode', included: false }
            ]}
            onUpgrade={() => handleUpgrade('basic')}
          />
          
          <PricingCard
            title="Research"
            price={29.99}
            current={user?.subscriptionTier === 'research'}
            badge="crown"
            badgeColor="islamic-gold"
            features={[
              'Unlimited messages',
              'Priority response times',
              'Full Sukoon therapy access',
              'Full Research Mode with citations',
              'Advanced database searching'
            ]}
            onUpgrade={() => handleUpgrade('research')}
          />
        </div>
        
        <div className="mt-8 text-center">
          <h4 className="text-xl font-bold mb-4 text-light-text">Need a Team Plan?</h4>
          <p className="text-light-text-secondary mb-6">Our Teams plan offers shared access and administrative features for organizations.</p>
          <Button
            variant="outline"
            className="px-8 py-3 rounded-lg border border-islamic-green text-islamic-green hover:bg-islamic-green hover:text-white transition-colors"
            onClick={() => handleUpgrade('teams')}
          >
            Learn about Teams ($99/month)
          </Button>
        </div>
        
        <DialogFooter className="mt-8 pt-4 border-t border-dark-border">
          <p className="text-light-text-secondary text-center w-full">
            Questions about our plans? <a href="#" className="text-islamic-green hover:underline">Contact us</a>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;

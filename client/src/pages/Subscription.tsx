import React, { useEffect, useState } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MarefaLogo from '@/components/MarefaLogo';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm: React.FC<{ planName: string }> = ({ planName }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription/success',
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        className="w-full py-3 bg-islamic-green hover:bg-islamic-dark text-white" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            Processing...
          </>
        ) : (
          <>Subscribe Now</>
        )}
      </Button>
      
      <div className="text-center text-sm text-light-text-secondary">
        <p>You'll be charged immediately, and subscription will renew monthly.</p>
        <p className="mt-2">
          <Button variant="link" className="p-0 text-islamic-green" onClick={() => navigate('/')}>
            Cancel and return to chat
          </Button>
        </p>
      </div>
    </form>
  );
};

const Subscription: React.FC = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Get the plan from the URL
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const plan = searchParams.get('plan') || 'basic';
  
  // Plan details
  const planDetails = {
    basic: { name: 'Basic Plan', price: 9.99, features: ['Unlimited messages', 'Full Ahkam 101 access', 'Extended Sukoon therapy sessions'] },
    research: { name: 'Research Plan', price: 29.99, features: ['Unlimited messages', 'Priority response times', 'Full Research Mode with citations', 'Advanced database searching'] },
    teams: { name: 'Teams Plan', price: 99, features: ['Multiple user accounts', 'Shared conversation history', 'Admin dashboard', 'Advanced analytics'] },
  };
  
  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.basic;
  
  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    
    // Create or get subscription as soon as the page loads
    apiRequest("POST", "/api/get-or-create-subscription", { 
      plan: plan || 'basic' 
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret)
      })
      .catch(error => {
        toast({
          title: "Subscription Error",
          description: error.message || "Failed to initialize subscription",
          variant: "destructive",
        });
        navigate('/');
      });
  }, [isAuthenticated, navigate, plan, toast]);
  
  if (!clientSecret) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-islamic-green border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark-bg islamic-pattern flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-dark-surface text-light-text">
        <CardHeader className="text-center border-b border-dark-border pb-6">
          <div className="mx-auto mb-4">
            <MarefaLogo className="h-16 w-16 mx-auto" />
          </div>
          <CardTitle className="text-2xl">{selectedPlan.name}</CardTitle>
          <CardDescription className="text-light-text-secondary">
            ${selectedPlan.price}/month
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-islamic-green">Plan Features:</h3>
            <ul className="space-y-2">
              {selectedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <i className="fas fa-check text-islamic-green mt-1 mr-2"></i>
                  <span className="text-light-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
            <SubscribeForm planName={plan} />
          </Elements>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-dark-border pt-4">
          <p className="text-xs text-light-text-secondary">
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Subscription;

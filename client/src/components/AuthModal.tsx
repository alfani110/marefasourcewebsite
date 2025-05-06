import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  username: z.string().min(3, 'Username must be at least 3 characters long').optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, register } = useAuth();
  
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      username: '',
    },
  });
  
  const handleSubmit = async (values: AuthFormValues) => {
    try {
      if (isSignUp) {
        if (values.username) {
          await register(values.email, values.password, values.username);
        } else {
          form.setError('username', { message: 'Username is required for registration' });
          return;
        }
      } else {
        await login(values.email, values.password);
      }
      onClose();
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-surface text-light-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </DialogTitle>
          <DialogDescription className="text-light-text-secondary">
            {isSignUp 
              ? 'Sign up to continue your conversation and save your chat history.'
              : 'Sign in to access your conversations and continue where you left off.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {isSignUp && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text-secondary">Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your username" 
                        className="bg-dark-card border-dark-border text-light-text" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary">Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your.email@example.com" 
                      className="bg-dark-card border-dark-border text-light-text" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-light-text-secondary">Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Your password" 
                      className="bg-dark-card border-dark-border text-light-text" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full py-3 rounded-lg bg-islamic-green text-white hover:bg-islamic-dark transition-colors"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
        </Form>
        
        <div className="relative flex items-center my-4">
          <div className="flex-grow border-t border-dark-border"></div>
          <span className="flex-shrink-0 mx-4 text-light-text-secondary text-sm">or continue with</span>
          <div className="flex-grow border-t border-dark-border"></div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button variant="outline" className="bg-dark-card border-dark-border text-light-text hover:bg-dark-border">
            <i className="fab fa-google mr-2"></i> Google
          </Button>
          
          <Button variant="outline" className="bg-dark-card border-dark-border text-light-text hover:bg-dark-border">
            <i className="fab fa-facebook mr-2"></i> Facebook
          </Button>
        </div>
        
        <DialogFooter className="text-sm flex flex-col sm:flex-row justify-center items-center mt-4">
          <div className="text-light-text-secondary">
            {isSignUp 
              ? 'Already have an account?' 
              : "Don't have an account?"}
            <Button 
              variant="link" 
              className="text-islamic-green hover:underline p-0 ml-1"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

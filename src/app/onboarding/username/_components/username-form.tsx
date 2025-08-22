'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { UsernameFormSchema, UsernameFormData, getUsernameError } from '@/lib/validation/username';
import { setUsername, checkUsernameAvailability } from '@/app/_actions/set-username';
import { useDebounce } from '@/hooks/use-debounce';

export function UsernameForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    checked: boolean;
    available: boolean;
    message?: string;
  }>({ checked: false, available: false });
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UsernameFormData>({
    resolver: zodResolver(UsernameFormSchema),
    mode: 'onChange',
  });
  
  const username = watch('username');
  const debouncedUsername = useDebounce(username, 500);
  
  // Check username availability
  const checkAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setAvailability({ checked: false, available: false });
      return;
    }
    
    // Check format first
    const formatError = getUsernameError(username);
    if (formatError) {
      setAvailability({ 
        checked: true, 
        available: false, 
        message: formatError 
      });
      return;
    }
    
    setIsChecking(true);
    try {
      const result = await checkUsernameAvailability(username);
      
      if (result.available) {
        setAvailability({ 
          checked: true, 
          available: true, 
          message: 'Username is available!' 
        });
      } else {
        let message = 'Username is not available';
        if (result.reason === 'reserved') {
          message = 'This username is reserved';
        } else if (result.reason === 'taken') {
          message = 'Username already taken';
        } else if (result.reason === 'invalid') {
          message = 'Invalid username format';
        }
        setAvailability({ 
          checked: true, 
          available: false, 
          message 
        });
      }
    } catch (err) {
      setAvailability({ 
        checked: true, 
        available: false, 
        message: 'Error checking availability' 
      });
    } finally {
      setIsChecking(false);
    }
  }, []);
  
  // Check availability when username changes
  useEffect(() => {
    if (debouncedUsername) {
      checkAvailability(debouncedUsername);
    } else {
      setAvailability({ checked: false, available: false });
    }
  }, [debouncedUsername, checkAvailability]);
  
  const onSubmit = async (data: UsernameFormData) => {
    // Don't submit if username is not available
    if (!availability.available) {
      setError('Please choose an available username');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('username', data.username);
      
      const result = await setUsername(formData);
      
      if (result.ok) {
        // Success! Redirect to profile or dashboard
        router.push('/profile');
      } else {
        setError(result.error || 'Failed to set username');
        // Re-check availability in case it was just taken
        checkAvailability(data.username);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder="johndoe"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            {...register('username')}
            disabled={isSubmitting}
            className="pr-10"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {isChecking && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {!isChecking && availability.checked && availability.available && (
              <Check className="h-4 w-4 text-green-600" />
            )}
            {!isChecking && availability.checked && !availability.available && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        
        {/* Format errors */}
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
        
        {/* Availability status */}
        {!errors.username && availability.checked && availability.message && (
          <p className={`text-sm ${availability.available ? 'text-green-600' : 'text-destructive'}`}>
            {availability.message}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground">
          3-30 characters, lowercase letters, numbers, and underscores only
        </p>
      </div>
      
      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || isChecking || !availability.available}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting username...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </form>
  );
}
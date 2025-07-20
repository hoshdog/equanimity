// src/app/auth/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Waves } from 'lucide-react';
import { signUp, signIn, sendVerificationEmail } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type AuthFormValues = z.infer<typeof formSchema>;

const devUsers = [
    { role: "Admin", email: "admin@example.com", password: "password123" },
    { role: "Jane Doe (Manager)", email: "jane.doe@example.com", password: "password123" },
    { role: "Alice (PM)", email: "alice.j@example.com", password: "password123" },
    { role: "Bob (Tech)", email: "bob.s@example.com", password: "password123" },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setLoading(true);
    try {
      if (isLogin) {
        // Sign In Logic
        await signIn(values.email, values.password);
        toast({ title: 'Login Successful', description: "Welcome back!" });
        router.push('/'); // Redirect to dashboard after login
      } else {
        // Sign Up Logic
        const user = await signUp(values.email, values.password);
        await sendVerificationEmail(user);
        toast({
          title: 'Account Created',
          description: 'A verification email has been sent. Please check your inbox.',
        });
        // You might want to automatically log them in or redirect to a "please verify" page
        router.push('/');
      }
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use by another account.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/operation-not-allowed':
           errorMessage = 'Email/password sign-in is not enabled. Please enable it in your Firebase project settings.';
           break;
        case 'auth/weak-password':
            errorMessage = 'The password is too weak.';
            break;
        default:
          // Use the default error message
          break;
      }
       toast({
        variant: 'destructive',
        title: isLogin ? 'Login Failed' : 'Sign Up Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDevLogin = (user: { email: string; password: string }) => {
    form.setValue('email', user.email);
    form.setValue('password', user.password);
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Waves className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{isLogin ? 'Welcome Back!' : 'Create an Account'}</CardTitle>
          <CardDescription>
            {isLogin ? "Enter your credentials to access your account." : "Fill out the form below to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLogin ? 'Log In' : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="pl-1">
              {isLogin ? 'Sign up' : 'Log in'}
            </Button>
          </div>
           {process.env.NODE_ENV === 'development' && (
                <>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                        <p className="text-center text-sm text-muted-foreground">Developer Quick Login</p>
                        <div className="grid grid-cols-2 gap-2">
                            {devUsers.map(user => (
                                <Button 
                                    key={user.role} 
                                    variant="outline"
                                    onClick={() => handleDevLogin(user)}
                                    disabled={loading}
                                >
                                    {user.role}
                                </Button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

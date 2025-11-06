import { SignIn } from '@clerk/nextjs';
import Image from 'next/image';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-light">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/windowsusa-logo.png"
              alt="Windows USA"
              width={200}
              height={60}
              className="h-auto w-auto"
              priority
            />
          </div>
          <p className="text-navy/70 text-sm">Sales Appointment Scheduler</p>
        </div>
        <SignIn 
          routing="path"
          path="/sign-in"
          signUpUrl={undefined}
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg border border-gray-300',
              headerTitle: 'text-navy font-bold',
              headerSubtitle: 'text-navy/70',
              socialButtonsBlockButton: 'bg-white border-gray-300 text-navy hover:bg-gray-light',
              formButtonPrimary: 'bg-primary hover:bg-primary-dark text-white',
              footerActionLink: 'text-primary hover:text-primary-dark',
              formFieldLabel: 'text-navy',
              formFieldInput: 'border-gray-300 focus:border-primary focus:ring-primary',
              footer: { display: 'none' }, // Hide sign-up link in footer
            },
            variables: {
              colorPrimary: '#E11B37',
              colorText: '#001F5B',
              colorBackground: '#FFFFFF',
              colorInputBackground: '#FFFFFF',
              colorInputText: '#001F5B',
            }
          }}
        />
      </div>
    </div>
  );
}


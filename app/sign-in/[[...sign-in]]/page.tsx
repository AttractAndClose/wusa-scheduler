import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-light">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-navy mb-2">Windows USA</h1>
          <p className="text-navy/70">Sales Appointment Scheduler</p>
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


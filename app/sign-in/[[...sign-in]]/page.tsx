import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn 
        routing="path"
        path="/sign-in"
        signUpUrl={undefined}
        appearance={{
          elements: {
            footer: { display: 'none' } // Hide sign-up link in footer
          }
        }}
      />
    </div>
  );
}


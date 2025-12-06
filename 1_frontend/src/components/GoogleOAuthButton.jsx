import React from 'react';
import { Chrome } from 'lucide-react';

const GoogleOAuthButton = ({ text = "Continue with Google" }) => {
    const handleGoogleLogin = () => {
        // Redirect to backend Google auth endpoint
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-300"
        >
            <Chrome size={20} />
            {text}
        </button>
    );
};

export default GoogleOAuthButton;

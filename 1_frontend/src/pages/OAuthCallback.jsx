import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            loginWithToken(token).then(success => {
                if (success) {
                    navigate('/');
                } else {
                    navigate('/login');
                }
            });
        } else {
            navigate('/login');
        }
    }, [searchParams, loginWithToken, navigate]);

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#0c0c0c]">
            <div className="text-center">
                <Loader2 className="animate-spin h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-400">Authenticating...</p>
            </div>
        </div>
    );
};

export default OAuthCallback;

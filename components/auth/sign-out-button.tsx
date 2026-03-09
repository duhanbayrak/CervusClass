'use client';

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function SignOutButton({ variant = "outline", className }: Readonly<{ variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link", className?: string }>) { // NOSONAR
    const [loading, setLoading] = useState(false);

    // We use a form submission to the server-side route handler
    // This ensures cookies are cleared correctly by the server
    const handleSignOut = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Also clear client-side storage just in case
            if (typeof globalThis !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
            }

            // Submit form programmically using fetch to handle redirect manually if needed, 
            // OR just submit the form naturally. Natural submit is better for full reload.
            // But we are in a text component, let's use fetch and then weird redirect?
            // No, getting a form ref is messy.

            // Simplest way: Fetch request to route handler
            await fetch('/auth/signout', {
                method: 'POST',
            });

            // Force reload to home
            globalThis.location.href = '/';

        } catch (err) {
            console.error(err);
            globalThis.location.href = '/';
        }
    };

    return (
        <form action="/auth/signout" method="POST" onSubmit={handleSignOut}>
            <Button
                variant={variant}
                type="submit"
                disabled={loading}
                className={className}
            >
                <LogOut className="w-4 h-4 mr-2" />
                {loading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
            </Button>
        </form>
    );
}

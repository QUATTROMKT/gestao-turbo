import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import { Rocket, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Login() {
    const { isAuthenticated, login, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) throw error;
                alert('Conta criada! Verifique seu email ou faça login.');
                setIsSignUp(false);
            } else {
                const result = await login(email, password);
                if (!result.success) {
                    setError(result.error || 'Credenciais inválidas');
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left Panel — Form */}
            <div className="flex flex-1 items-center justify-center p-8">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25">
                            <Rocket className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Agência Turbo</h1>
                            <p className="text-sm text-muted-foreground">Sistema de Gestão</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-foreground">{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isSignUp ? 'Preencha os dados abaixo' : 'Faça login para acessar seu painel'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-scale-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            id="email"
                            label="E-mail"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />

                        {isSignUp && (
                            <Input
                                id="name"
                                label="Nome Completo"
                                type="text"
                                placeholder="Seu Nome"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        )}

                        <div className="relative">
                            <Input
                                id="password"
                                label="Senha"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Entrando...
                                </>
                            ) : (
                                isSignUp ? 'Criar Conta' : 'Entrar'
                            )}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-primary hover:underline"
                        >
                            {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Crie uma agora'}
                        </button>
                    </div>
                </div>
            </div>
            );

            {/* Right Panel — Decorative */}
            <div className="hidden lg:flex lg:flex-1 items-center justify-center gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white blur-3xl" />
                    <div className="absolute bottom-20 right-20 h-80 w-80 rounded-full bg-white blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-white blur-2xl" />
                </div>
                <div className="relative text-center text-white px-12">
                    <div className="mb-6 flex justify-center">
                        <Rocket className="h-20 w-20 opacity-90" />
                    </div>
                    <h2 className="text-3xl font-bold mb-3">Agency Operating System</h2>
                    <p className="text-lg opacity-80 max-w-md">
                        Dashboard, Operações, Processos e Portal do Cliente — tudo em um só lugar.
                    </p>
                    <div className="mt-8 flex justify-center gap-6 text-sm opacity-70">
                        <div className="text-center">
                            <div className="text-2xl font-bold">EOS</div>
                            <div>Metodologia</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">PARA</div>
                            <div>Processos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">L10</div>
                            <div>Reuniões</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

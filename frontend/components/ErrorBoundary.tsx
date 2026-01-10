'use client';

import { Component, ReactNode } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-4">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle className="text-red-600">Đã xảy ra lỗi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Ứng dụng đã gặp lỗi không mong muốn. Vui lòng thử tải lại trang.
                            </p>
                            {this.state.error && (
                                <p className="text-sm text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                                    {this.state.error.message}
                                </p>
                            )}
                            <Button onClick={() => window.location.reload()}>
                                Tải lại trang
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        © 2026 Flash Sale
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Built with Next.js + NestJS
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

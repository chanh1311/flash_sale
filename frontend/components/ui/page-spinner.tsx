import { Spinner } from './spinner';

export function PageSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Spinner className="size-8" />
        </div>
    );
}

import { classNames } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        // Varianten
        variant === 'primary' && 'bg-primary hover:bg-primary-light text-white',
        variant === 'secondary' && 'bg-secondary hover:bg-secondary-light text-white',
        variant === 'outline' && 'border-2 border-primary text-primary hover:bg-primary-light/5',
        // Größen
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        className
      )}
      {...props}
    />
  );
} 
export function Card({ children, className, ...props }) {
  return (
    <div 
      className={classNames(
        "bg-white rounded-lg shadow-sm border border-gray-200",
        "hover:shadow-md transition-shadow duration-200",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
} 
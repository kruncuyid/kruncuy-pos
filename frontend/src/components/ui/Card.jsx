export default function Card({ children, className = "", ...props }) {
  return (
    <div className={`kr-card ${className}`} {...props}>
      {children}
    </div>
  );
}

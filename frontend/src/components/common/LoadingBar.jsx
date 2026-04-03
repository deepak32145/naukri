import { useSelector } from 'react-redux';

const LoadingBar = () => {
  const loading = useSelector((state) => state.ui.loading);

  if (!loading) return null;

  return (
    <div className="fixed top-16 left-0 w-full z-50">
      <div
        className="h-1 bg-blue-500"
        style={{
          background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
          animation: 'loading-bar 1.5s ease-in-out infinite',
        }}
      />
      <style>
        {`
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingBar;
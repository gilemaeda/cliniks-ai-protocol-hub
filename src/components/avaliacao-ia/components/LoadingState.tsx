
const LoadingState = () => {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-gray-500">Carregando histórico...</p>
    </div>
  );
};

export default LoadingState;

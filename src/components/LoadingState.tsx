export function LoadingState({ message = '正在加载数据...' }: { message?: string }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-on-surface-variant">
      <div className="bg-surface-container-lowest px-6 py-4 rounded-full shadow-sm border border-outline-variant/20">
        {message}
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-6">
      <div className="max-w-md bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm text-center">
        <h2 className="text-xl font-bold mb-2">加载失败</h2>
        <p className="text-on-surface-variant">{message}</p>
      </div>
    </div>
  );
}

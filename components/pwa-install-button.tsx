export function PwaInstallButton() {
  return (
    <div className="mx-auto mt-4 max-w-md">
      <a className="btn-secondary w-full" href="/downloads/cromoswap-cuenca.apk" download>
        Descargar APK
      </a>
      <p className="mt-2 text-center text-xs font-semibold text-slate-500">
        En Android permite instalar apps desconocidas cuando el sistema lo solicite.
      </p>
    </div>
  );
}

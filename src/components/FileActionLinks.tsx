import { buildCloudinaryDownloadUrl } from "@/lib/cloudinary";

type FileActionLinksProps = {
  url: string;
  fileName?: string;
  openLabel?: string;
  downloadLabel?: string;
  openClassName: string;
  downloadClassName: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export default function FileActionLinks({
  url,
  fileName,
  openLabel = "Open PDF",
  downloadLabel = "Download",
  openClassName,
  downloadClassName,
  onClick,
}: FileActionLinksProps) {
  const downloadUrl = buildCloudinaryDownloadUrl(url, fileName);

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={openClassName}
        onClick={onClick}
      >
        <span className="material-symbols-outlined text-[inherit]">visibility</span>
        {openLabel}
      </a>
      <a
        href={downloadUrl}
        download={fileName}
        className={downloadClassName}
        onClick={onClick}
      >
        <span className="material-symbols-outlined text-[inherit]">download</span>
        {downloadLabel}
      </a>
    </>
  );
}
